/**
 * Brain Gym - Gamification Engine
 * Shared module for streaks, scores, and daily activity history.
 *
 * Source of truth:
 * 1) Supabase (authenticated user scope)
 * 2) localStorage cache for offline fallback
 */

const Gamification = (function () {
    'use strict';

    var STORAGE_KEY = 'brainGymStats';
    var LEGACY_MATH_KEY = 'mentalMathData';
    var MIGRATION_KEY = 'gamification_localstorage_v1';
    var DEVICE_ID_KEY = 'brainGymDeviceId';
    var MAX_DAILY_ENTRIES = 60;
    var SAVE_DEBOUNCE_MS = 420;

    var cloud = {
        client: null,
        user: null,
        enabled: false,
        syncInFlight: false,
        saveTimer: null
    };

    var cache = normalizeData(readLocalData());
    cache = applyLegacyMathSync(cache, readLegacyMathTotalProblems());
    writeLocalData(cache);
    var deviceId = getOrCreateDeviceId();

    bootstrapCloud().then(null, function () {}).finally(function () {
        emitReady();
    });

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function toDateKey(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    function todayStr() {
        return toDateKey(new Date());
    }

    function yesterdayStr() {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        return toDateKey(d);
    }

    function toNonNegativeInt(value) {
        var n = Number(value);
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.floor(n);
    }

    function getOrCreateDeviceId() {
        try {
            var existing = localStorage.getItem(DEVICE_ID_KEY);
            if (existing && typeof existing === 'string') return existing;

            var generated;
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                generated = window.crypto.randomUUID();
            } else {
                generated = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            }
            localStorage.setItem(DEVICE_ID_KEY, generated);
            return generated;
        } catch (_) {
            return 'dev_fallback';
        }
    }

    function getModuleCounterKey(moduleName) {
        return moduleName + '@' + deviceId;
    }

    function normalizeModuleName(moduleKey) {
        if (typeof moduleKey !== 'string') return '';
        var idx = moduleKey.lastIndexOf('@');
        if (idx <= 0) return moduleKey;
        return moduleKey.slice(0, idx);
    }

    function sumModuleCounts(modules) {
        if (!modules || typeof modules !== 'object') return 0;
        var total = 0;
        Object.keys(modules).forEach(function (key) {
            total += toNonNegativeInt(modules[key]);
        });
        return total;
    }

    function aggregateModuleCounts(modules) {
        var aggregated = {};
        if (!modules || typeof modules !== 'object') return aggregated;
        Object.keys(modules).forEach(function (key) {
            var normalizedKey = normalizeModuleName(key);
            if (!normalizedKey) return;
            aggregated[normalizedKey] = (aggregated[normalizedKey] || 0) + toNonNegativeInt(modules[key]);
        });
        return aggregated;
    }

    function defaultData() {
        return {
            streak: { count: 0, lastDate: null },
            totalScore: 0,
            lastSyncedMathScore: 0,
            daily: {}
        };
    }

    function normalizeData(raw) {
        var fallback = defaultData();
        if (!raw || typeof raw !== 'object') return fallback;

        var normalized = {
            streak: {
                count: toNonNegativeInt(raw.streak && raw.streak.count),
                lastDate: raw.streak && typeof raw.streak.lastDate === 'string' ? raw.streak.lastDate : null
            },
            totalScore: toNonNegativeInt(raw.totalScore),
            lastSyncedMathScore: toNonNegativeInt(raw.lastSyncedMathScore),
            daily: {}
        };

        if (raw.daily && typeof raw.daily === 'object') {
            Object.keys(raw.daily).forEach(function (dateKey) {
                var entry = raw.daily[dateKey];
                if (!entry || typeof entry !== 'object') return;

                var modules = {};
                if (entry.modules && typeof entry.modules === 'object') {
                    Object.keys(entry.modules).forEach(function (moduleName) {
                        modules[moduleName] = toNonNegativeInt(entry.modules[moduleName]);
                    });
                }

                normalized.daily[dateKey] = {
                    count: toNonNegativeInt(entry.count),
                    modules: modules
                };
            });
        }

        pruneDailyData(normalized);
        return normalized;
    }

    function readLocalData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultData();
            return normalizeData(JSON.parse(raw));
        } catch (_) {
            return defaultData();
        }
    }

    function writeLocalData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeData(data)));
        } catch (_) {
            // Ignore local storage failures.
        }
    }

    function readLegacyMathTotalProblems() {
        try {
            var raw = localStorage.getItem(LEGACY_MATH_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return toNonNegativeInt(parsed && parsed.totalProblems);
        } catch (_) {
            return null;
        }
    }

    function applyLegacyMathSync(data, totalProblems) {
        var normalized = normalizeData(data);
        var safeTotal = toNonNegativeInt(totalProblems);
        if (safeTotal <= 0) return normalized;

        if (safeTotal < normalized.lastSyncedMathScore) {
            normalized.lastSyncedMathScore = safeTotal;
            return normalized;
        }

        var delta = safeTotal - normalized.lastSyncedMathScore;
        if (delta > 0) {
            normalized.totalScore += delta;
            normalized.lastSyncedMathScore = safeTotal;
        }
        return normalized;
    }

    function emitUpdated() {
        try {
            window.dispatchEvent(new CustomEvent('brain-gym:gamification-updated', {
                detail: { data: clone(cache) }
            }));
        } catch (_) {
            // Ignore dispatch errors.
        }
    }

    var readyFired = false;
    function emitReady() {
        if (readyFired) return;
        readyFired = true;
        try {
            window.dispatchEvent(new CustomEvent('brain-gym:gamification-ready', {
                detail: { data: clone(cache) }
            }));
        } catch (_) {
            // Ignore dispatch errors.
        }
    }

    function load() {
        return normalizeData(cache);
    }

    function save(data) {
        cache = normalizeData(data);
        writeLocalData(cache);
        emitUpdated();
        queueCloudSave();
    }

    function pruneDailyData(data) {
        var keys = Object.keys(data.daily).sort();
        while (keys.length > MAX_DAILY_ENTRIES) {
            var oldest = keys.shift();
            delete data.daily[oldest];
        }
    }

    function queueCloudSave() {
        if (!cloud.enabled) return;
        if (cloud.saveTimer) {
            window.clearTimeout(cloud.saveTimer);
        }
        cloud.saveTimer = window.setTimeout(function () {
            flushCloudSave();
        }, SAVE_DEBOUNCE_MS);
    }

    async function flushCloudSave() {
        if (!cloud.enabled || !cloud.client || !cloud.user) return;
        if (cloud.syncInFlight) {
            queueCloudSave();
            return;
        }

        cloud.syncInFlight = true;
        try {
            await persistCloudData(cache);
        } catch (error) {
            console.error('Gamification cloud save failed:', error);
        } finally {
            cloud.syncInFlight = false;
        }
    }

    function mergeDailyEntries(entryA, entryB) {
        var a = entryA || { count: 0, modules: {} };
        var b = entryB || { count: 0, modules: {} };
        var modules = {};

        Object.keys(a.modules || {}).forEach(function (key) {
            modules[key] = toNonNegativeInt(a.modules[key]);
        });
        Object.keys(b.modules || {}).forEach(function (key) {
            modules[key] = Math.max(modules[key] || 0, toNonNegativeInt(b.modules[key]));
        });

        var mergedModuleTotal = sumModuleCounts(modules);

        return {
            count: Math.max(toNonNegativeInt(a.count), toNonNegativeInt(b.count), mergedModuleTotal),
            modules: modules
        };
    }

    function pickBestStreak(streakA, streakB) {
        var a = streakA || { count: 0, lastDate: null };
        var b = streakB || { count: 0, lastDate: null };

        var aCount = toNonNegativeInt(a.count);
        var bCount = toNonNegativeInt(b.count);

        if (!a.lastDate && !b.lastDate) {
            return { count: Math.max(aCount, bCount), lastDate: null };
        }
        if (!a.lastDate) return { count: bCount, lastDate: b.lastDate };
        if (!b.lastDate) return { count: aCount, lastDate: a.lastDate };

        // Use the most recent date, but keep the higher count if dates
        // are within 1 day of each other (covers cross-device same-streak).
        var today = todayStr();
        var yesterday = yesterdayStr();
        var latest = a.lastDate > b.lastDate ? a.lastDate : b.lastDate;
        var other = a.lastDate > b.lastDate ? b.lastDate : a.lastDate;
        var latestCount = a.lastDate > b.lastDate ? aCount : bCount;
        var otherCount = a.lastDate > b.lastDate ? bCount : aCount;

        // If both dates are consecutive or the same, the streak is continuous
        if (latest === other || other === yesterday && latest === today) {
            return { count: Math.max(latestCount, otherCount), lastDate: latest };
        }

        // Otherwise the most recent date's streak is the active one,
        // but never reduce below the latest count
        return { count: Math.max(latestCount, otherCount), lastDate: latest };
    }

    function mergeData(left, right) {
        var a = normalizeData(left);
        var b = normalizeData(right);
        var merged = defaultData();

        merged.streak = pickBestStreak(a.streak, b.streak);
        merged.totalScore = Math.max(toNonNegativeInt(a.totalScore), toNonNegativeInt(b.totalScore));
        merged.lastSyncedMathScore = Math.max(
            toNonNegativeInt(a.lastSyncedMathScore),
            toNonNegativeInt(b.lastSyncedMathScore)
        );

        var keys = Object.keys(a.daily).concat(Object.keys(b.daily));
        var seen = {};
        keys.forEach(function (key) {
            if (seen[key]) return;
            seen[key] = true;
            merged.daily[key] = mergeDailyEntries(a.daily[key], b.daily[key]);
        });

        pruneDailyData(merged);
        return merged;
    }

    function toIsoDateString(value) {
        if (!value) return null;
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value.toISOString();
        }

        var maybeDate = new Date(value);
        if (!isNaN(maybeDate.getTime())) return maybeDate.toISOString();
        return null;
    }

    async function persistCloudData(data) {
        var normalized = normalizeData(data);
        var userId = cloud.user.id;

        var summaryRow = {
            user_id: userId,
            streak_count: normalized.streak.count,
            streak_last_date: normalized.streak.lastDate,
            total_score: normalized.totalScore,
            last_synced_math_score: normalized.lastSyncedMathScore
        };

        var summaryResponse = await cloud.client
            .from('user_gamification_stats')
            .upsert(summaryRow, { onConflict: 'user_id' });

        if (summaryResponse.error) throw summaryResponse.error;

        var dailyRows = Object.keys(normalized.daily).map(function (dateKey) {
            var entry = normalized.daily[dateKey];
            return {
                user_id: userId,
                activity_date: dateKey,
                activity_count: toNonNegativeInt(entry.count),
                module_counts: entry.modules || {}
            };
        });

        if (dailyRows.length > 0) {
            var dailyResponse = await cloud.client
                .from('user_daily_activity')
                .upsert(dailyRows, { onConflict: 'user_id,activity_date' });
            if (dailyResponse.error) throw dailyResponse.error;

            var sortedKeys = Object.keys(normalized.daily).sort();
            var oldestKeptDate = sortedKeys.length > 0 ? sortedKeys[0] : null;
            if (oldestKeptDate) {
                var pruneResponse = await cloud.client
                    .from('user_daily_activity')
                    .delete()
                    .eq('user_id', userId)
                    .lt('activity_date', oldestKeptDate);
                if (pruneResponse.error) throw pruneResponse.error;
            }
        }
    }

    async function hasMigrationMark() {
        var response = await cloud.client
            .from('user_migrations')
            .select('migration_key')
            .eq('migration_key', MIGRATION_KEY)
            .maybeSingle();

        if (response.error && response.error.code !== 'PGRST116') {
            throw response.error;
        }

        return Boolean(response.data);
    }

    async function upsertMigrationMark(metadata) {
        var response = await cloud.client
            .from('user_migrations')
            .upsert({
                user_id: cloud.user.id,
                migration_key: MIGRATION_KEY,
                metadata: metadata || {}
            }, { onConflict: 'user_id,migration_key' });

        if (response.error) throw response.error;
    }

    async function fetchCloudData() {
        var summaryResponse = await cloud.client
            .from('user_gamification_stats')
            .select('streak_count, streak_last_date, total_score, last_synced_math_score')
            .maybeSingle();

        if (summaryResponse.error && summaryResponse.error.code !== 'PGRST116') {
            throw summaryResponse.error;
        }

        var dailyResponse = await cloud.client
            .from('user_daily_activity')
            .select('activity_date, activity_count, module_counts')
            .order('activity_date', { ascending: false })
            .limit(MAX_DAILY_ENTRIES);

        if (dailyResponse.error) {
            throw dailyResponse.error;
        }

        var remote = defaultData();

        if (summaryResponse.data) {
            remote.streak.count = toNonNegativeInt(summaryResponse.data.streak_count);
            remote.streak.lastDate = summaryResponse.data.streak_last_date || null;
            remote.totalScore = toNonNegativeInt(summaryResponse.data.total_score);
            remote.lastSyncedMathScore = toNonNegativeInt(summaryResponse.data.last_synced_math_score);
        }

        (dailyResponse.data || []).forEach(function (row) {
            var dateKey = row.activity_date;
            if (!dateKey) return;
            remote.daily[dateKey] = {
                count: toNonNegativeInt(row.activity_count),
                modules: row.module_counts && typeof row.module_counts === 'object'
                    ? row.module_counts
                    : {}
            };
        });

        return normalizeData(remote);
    }

    async function runMigrationIfNeeded() {
        var alreadyMigrated = await hasMigrationMark();
        if (alreadyMigrated) return;

        var localSnapshot = normalizeData(cache);
        var remoteSnapshot = await fetchCloudData();
        var merged = mergeData(remoteSnapshot, localSnapshot);

        await persistCloudData(merged);
        await upsertMigrationMark({ source: 'localStorage', at: toIsoDateString(new Date()) });

        cache = merged;
        writeLocalData(cache);
        emitUpdated();
    }

    async function hydrateFromCloud() {
        var remoteSnapshot = await fetchCloudData();
        var merged = mergeData(cache, remoteSnapshot);
        cache = merged;
        writeLocalData(cache);
        emitUpdated();
        emitReady();
    }

    async function bootstrapCloud() {
        if (!window.BrainGymAuth || !window.BrainGymAuth.ready) return;

        try {
            var auth = await window.BrainGymAuth.ready;
            if (!auth || !auth.client || !auth.user) return;

            cloud.client = auth.client;
            cloud.user = auth.user;
            cloud.enabled = true;

            await runMigrationIfNeeded();
            await hydrateFromCloud();
            queueCloudSave();
        } catch (error) {
            console.error('Gamification cloud bootstrap failed:', error);
        }
    }

    function updateStreak() {
        var data = load();
        var today = todayStr();
        var yesterday = yesterdayStr();

        if (data.streak.lastDate === today) {
            return data.streak;
        }

        if (data.streak.lastDate === yesterday) {
            data.streak.count += 1;
        } else {
            data.streak.count = 1;
        }

        data.streak.lastDate = today;
        save(data);
        return data.streak;
    }

    function getStreak() {
        var data = load();
        return {
            count: data.streak.count,
            lastDate: data.streak.lastDate
        };
    }

    function getScore() {
        return load().totalScore;
    }

    function addScore(points) {
        var safePoints = toNonNegativeInt(points);
        if (safePoints <= 0) return getScore();

        var data = load();
        data.totalScore += safePoints;
        save(data);
        return data.totalScore;
    }

    function syncLegacyMathScore(totalProblems) {
        var safeTotal = toNonNegativeInt(totalProblems);
        if (safeTotal <= 0) return load().lastSyncedMathScore;

        var data = applyLegacyMathSync(load(), safeTotal);
        save(data);
        return data.lastSyncedMathScore;
    }

    function recordActivity(moduleName, count) {
        var safeCount = toNonNegativeInt(count);
        if (safeCount <= 0) return;

        var safeModule = typeof moduleName === 'string' && moduleName.trim()
            ? moduleName.trim()
            : 'general';
        var moduleCounterKey = getModuleCounterKey(safeModule);

        var data = load();
        var today = todayStr();
        var yesterday = yesterdayStr();

        if (!data.daily[today]) {
            data.daily[today] = { count: 0, modules: {} };
        }

        data.daily[today].count += safeCount;
        data.daily[today].modules[moduleCounterKey] =
            (data.daily[today].modules[moduleCounterKey] || 0) + safeCount;

        if (data.streak.lastDate !== today) {
            if (data.streak.lastDate === yesterday) {
                data.streak.count += 1;
            } else {
                data.streak.count = 1;
            }
            data.streak.lastDate = today;
        }

        pruneDailyData(data);
        save(data);
    }

    function getDailyStats(days) {
        var safeDays = Math.max(toNonNegativeInt(days), 1);
        var data = load();
        var result = [];
        var now = new Date();

        for (var i = safeDays - 1; i >= 0; i -= 1) {
            var dt = new Date(now);
            dt.setDate(dt.getDate() - i);

            var key = toDateKey(dt);
            var entry = data.daily[key] || { count: 0, modules: {} };
            var aggregatedModules = aggregateModuleCounts(entry.modules);
            var computedCount = sumModuleCounts(aggregatedModules);

            result.push({
                date: key,
                label: dt.toLocaleDateString('en-US', { weekday: 'short' }),
                count: Math.max(toNonNegativeInt(entry.count), computedCount),
                modules: aggregatedModules
            });
        }

        return result;
    }

    function getTodayCount() {
        var data = load();
        var today = todayStr();
        if (!data.daily[today]) return 0;
        var entry = data.daily[today];
        var moduleCount = sumModuleCounts(aggregateModuleCounts(entry.modules));
        return Math.max(toNonNegativeInt(entry.count), moduleCount);
    }

    return {
        updateStreak: updateStreak,
        getStreak: getStreak,
        getScore: getScore,
        addScore: addScore,
        syncLegacyMathScore: syncLegacyMathScore,
        recordActivity: recordActivity,
        getDailyStats: getDailyStats,
        getTodayCount: getTodayCount
    };
})();
