/**
 * Mental Math Trainer persistence helper.
 * Supabase is the primary source of truth; localStorage is a fallback cache.
 */
(function () {
    'use strict';

    if (window.MathTrainerPersistence) return;

    function create(options) {
        var storageKeys = options.storageKeys;
        var cloudKeys = options.cloudKeys;
        var defaultSettings = options.defaultSettings;
        var defaultMixedConfig = options.defaultMixedConfig;

        var maxEntries = {
            sessions: 100,
            solveTimes: 500,
            wrongAnswers: 100
        };

        var cloud = {
            client: null,
            userId: null,
            ready: false,
            activeSnapshot: null,
            activeSaveTimer: null
        };

        var activeSessionStorageKey = storageKeys.SETTINGS + ':activeSession';

        var sessions = readArrayFromLocal(storageKeys.SESSIONS);
        var solveTimes = readArrayFromLocal(storageKeys.SOLVE_TIMES);
        var wrongAnswers = readArrayFromLocal(storageKeys.HISTORY);
        var settingsPayload = normalizeSettingsPayload(readJsonFromLocal(storageKeys.SETTINGS, null));
        cloud.activeSnapshot = readActiveSessionFromLocal();

        function clone(value) {
            return JSON.parse(JSON.stringify(value));
        }

        function readJsonFromLocal(key, fallback) {
            try {
                var raw = localStorage.getItem(key);
                if (!raw) return fallback;
                return JSON.parse(raw);
            } catch (_) {
                return fallback;
            }
        }

        function writeJsonToLocal(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (_) {
                // Ignore local storage failures.
            }
        }

        function readArrayFromLocal(key) {
            var parsed = readJsonFromLocal(key, []);
            return Array.isArray(parsed) ? parsed : [];
        }

        function readActiveSessionFromLocal() {
            var parsed = readJsonFromLocal(activeSessionStorageKey, null);
            return parsed && typeof parsed === 'object' ? parsed : null;
        }

        function writeActiveSessionToLocal(snapshot) {
            if (!snapshot || typeof snapshot !== 'object') {
                try {
                    localStorage.removeItem(activeSessionStorageKey);
                } catch (_) {
                    // Ignore local storage failures.
                }
                return;
            }
            writeJsonToLocal(activeSessionStorageKey, snapshot);
        }

        function defaultSettingsPayload() {
            return {
                settings: clone(defaultSettings),
                timeLimit: 30,
                mixedConfig: clone(defaultMixedConfig),
                config: {
                    verticalAlign: true,
                    digitA: 1,
                    digitB: 1,
                    divisionLevel: 2,
                    gcfDifficulty: 2,
                    lcmDifficulty: 2,
                    patternDifficulty: 2,
                    gcfNumberCount: 2,
                    lcmNumberCount: 2
                }
            };
        }

        function toSafeInt(value, fallback) {
            var parsed = Number(value);
            if (!Number.isFinite(parsed)) return fallback;
            return Math.floor(parsed);
        }

        function normalizeSettingsPayload(raw) {
            var defaults = defaultSettingsPayload();
            if (!raw || typeof raw !== 'object') return defaults;

            var legacyShape = !raw.settings && !raw.mixedConfig && !raw.config && raw.timeLimit === undefined;
            if (legacyShape) {
                return {
                    settings: Object.assign({}, defaults.settings, raw),
                    timeLimit: defaults.timeLimit,
                    mixedConfig: defaults.mixedConfig,
                    config: defaults.config
                };
            }

            var merged = clone(defaults);
            merged.settings = Object.assign({}, defaults.settings, raw.settings || {});
            merged.timeLimit = Math.max(0, toSafeInt(raw.timeLimit, defaults.timeLimit));
            merged.mixedConfig = Object.assign({}, defaults.mixedConfig, raw.mixedConfig || {});
            merged.config = Object.assign({}, defaults.config, raw.config || {});
            return merged;
        }

        function trimEntries(list, maxLength) {
            return list.length > maxLength ? list.slice(-maxLength) : list;
        }

        function hashString(input) {
            var hash = 2166136261;
            for (var i = 0; i < input.length; i += 1) {
                hash ^= input.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            return (hash >>> 0).toString(16);
        }

        function eventHash(prefix, payload) {
            return prefix + '_' + hashString(JSON.stringify(payload));
        }

        function toIso(value) {
            var date = new Date(value || Date.now());
            if (isNaN(date.getTime())) return new Date().toISOString();
            return date.toISOString();
        }

        function updateLocalCaches() {
            writeJsonToLocal(storageKeys.SESSIONS, sessions);
            writeJsonToLocal(storageKeys.SOLVE_TIMES, solveTimes);
            writeJsonToLocal(storageKeys.HISTORY, wrongAnswers);
            writeJsonToLocal(storageKeys.SETTINGS, settingsPayload);
        }

        function sessionRow(session) {
            var hashBase = {
                mode: session.mode,
                correct: session.correct,
                total: session.total,
                accuracy: session.accuracy,
                avgTime: session.avgTime,
                bestTime: session.bestTime,
                timestamp: session.timestamp,
                times: session.times
            };
            return {
                user_id: cloud.userId,
                event_hash: eventHash('session', hashBase),
                mode: session.mode || 'unknown',
                correct: Number(session.correct || 0),
                total: Number(session.total || 0),
                accuracy: Number(session.accuracy || 0),
                avg_time: session.avgTime === undefined || session.avgTime === null ? null : Number(session.avgTime),
                best_time: session.bestTime === undefined || session.bestTime === null ? null : Number(session.bestTime),
                session_timestamp: toIso(session.timestamp),
                times: Array.isArray(session.times) ? session.times : [],
                payload: session
            };
        }

        function solveTimeRow(item) {
            var hashBase = {
                mode: item.mode,
                time: item.time,
                timestamp: item.timestamp
            };
            return {
                user_id: cloud.userId,
                event_hash: eventHash('solve', hashBase),
                mode: item.mode || 'unknown',
                solve_time: Number(item.time || 0),
                solve_timestamp: toIso(item.timestamp),
                payload: item
            };
        }

        function wrongAnswerRow(item) {
            var hashBase = {
                problem: item.problem,
                userAnswer: item.userAnswer,
                correctAnswer: item.correctAnswer,
                operation: item.operation,
                timestamp: item.timestamp
            };
            return {
                user_id: cloud.userId,
                event_hash: eventHash('wrong', hashBase),
                problem: String(item.problem || ''),
                user_answer: item.userAnswer === undefined ? null : String(item.userAnswer),
                correct_answer: item.correctAnswer === undefined ? null : String(item.correctAnswer),
                operation: item.operation || null,
                answered_at: toIso(item.timestamp),
                payload: item
            };
        }

        async function upsertMany(table, rows) {
            if (!cloud.ready || !rows || rows.length === 0) return;
            var response = await cloud.client
                .from(table)
                .upsert(rows, { onConflict: 'user_id,event_hash', ignoreDuplicates: true });
            if (response.error) throw response.error;
        }

        async function ensureMigrationMark() {
            var hasMarkResponse = await cloud.client
                .from('user_migrations')
                .select('migration_key')
                .eq('migration_key', cloudKeys.MIGRATION)
                .maybeSingle();

            if (hasMarkResponse.error && hasMarkResponse.error.code !== 'PGRST116') {
                throw hasMarkResponse.error;
            }

            if (hasMarkResponse.data) return;

            if (sessions.length > 0) await upsertMany('math_trainer_sessions', sessions.map(sessionRow));
            if (solveTimes.length > 0) await upsertMany('math_trainer_solve_times', solveTimes.map(solveTimeRow));
            if (wrongAnswers.length > 0) await upsertMany('math_trainer_wrong_answers', wrongAnswers.map(wrongAnswerRow));

            var settingsResponse = await cloud.client
                .from('user_settings')
                .upsert({
                    user_id: cloud.userId,
                    app_key: cloudKeys.SETTINGS_APP_KEY,
                    settings: settingsPayload
                }, { onConflict: 'user_id,app_key' });
            if (settingsResponse.error) throw settingsResponse.error;

            var markResponse = await cloud.client
                .from('user_migrations')
                .upsert({
                    user_id: cloud.userId,
                    migration_key: cloudKeys.MIGRATION,
                    metadata: { source: 'localStorage', at: new Date().toISOString() }
                }, { onConflict: 'user_id,migration_key' });
            if (markResponse.error) throw markResponse.error;
        }

        function toTimestamp(value) {
            var ts = new Date(value || 0).getTime();
            return Number.isFinite(ts) ? ts : 0;
        }

        function mergeByHash(localItems, remoteItems, hashBuilder, maxLength, getTimestamp) {
            var map = new Map();
            localItems.forEach(function (item) {
                map.set(hashBuilder(item), item);
            });
            remoteItems.forEach(function (item) {
                map.set(hashBuilder(item), item);
            });
            var merged = Array.from(map.values());
            if (typeof getTimestamp === 'function') {
                merged.sort(function (left, right) {
                    return getTimestamp(left) - getTimestamp(right);
                });
            }
            return trimEntries(merged, maxLength);
        }

        async function hydrateFromCloud() {
            var responses = await Promise.all([
                cloud.client.from('math_trainer_sessions').select('payload').order('session_timestamp', { ascending: false }).limit(maxEntries.sessions),
                cloud.client.from('math_trainer_solve_times').select('payload').order('solve_timestamp', { ascending: false }).limit(maxEntries.solveTimes),
                cloud.client.from('math_trainer_wrong_answers').select('payload').order('answered_at', { ascending: false }).limit(maxEntries.wrongAnswers),
                cloud.client.from('user_settings').select('settings').eq('app_key', cloudKeys.SETTINGS_APP_KEY).maybeSingle(),
                cloud.client.from('user_module_state').select('state').eq('module_key', cloudKeys.ACTIVE_SESSION).maybeSingle()
            ]);

            var sessionsRes = responses[0];
            var solveTimesRes = responses[1];
            var wrongAnswersRes = responses[2];
            var settingsRes = responses[3];
            var activeRes = responses[4];

            if (sessionsRes.error) throw sessionsRes.error;
            if (solveTimesRes.error) throw solveTimesRes.error;
            if (wrongAnswersRes.error) throw wrongAnswersRes.error;
            if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;
            if (activeRes.error && activeRes.error.code !== 'PGRST116') throw activeRes.error;

            var remoteSessions = (sessionsRes.data || []).map(function (row) { return row.payload; }).filter(Boolean);
            var remoteSolveTimes = (solveTimesRes.data || []).map(function (row) { return row.payload; }).filter(Boolean);
            var remoteWrongAnswers = (wrongAnswersRes.data || []).map(function (row) { return row.payload; }).filter(Boolean);

            sessions = mergeByHash(
                sessions,
                remoteSessions,
                function (item) {
                    return eventHash('session', {
                        mode: item.mode,
                        correct: item.correct,
                        total: item.total,
                        accuracy: item.accuracy,
                        avgTime: item.avgTime,
                        bestTime: item.bestTime,
                        timestamp: item.timestamp,
                        times: item.times
                    });
                },
                maxEntries.sessions,
                function (item) {
                    return toTimestamp(item && item.timestamp);
                }
            );

            solveTimes = mergeByHash(
                solveTimes,
                remoteSolveTimes,
                function (item) {
                    return eventHash('solve', {
                        mode: item.mode,
                        time: item.time,
                        timestamp: item.timestamp
                    });
                },
                maxEntries.solveTimes,
                function (item) {
                    return toTimestamp(item && item.timestamp);
                }
            );

            wrongAnswers = mergeByHash(
                wrongAnswers,
                remoteWrongAnswers,
                function (item) {
                    return eventHash('wrong', {
                        problem: item.problem,
                        userAnswer: item.userAnswer,
                        correctAnswer: item.correctAnswer,
                        operation: item.operation,
                        timestamp: item.timestamp
                    });
                },
                maxEntries.wrongAnswers,
                function (item) {
                    return toTimestamp(item && item.timestamp);
                }
            );

            if (settingsRes.data && settingsRes.data.settings) {
                settingsPayload = normalizeSettingsPayload(settingsRes.data.settings);
            }

            var remoteActiveSnapshot = activeRes.data && activeRes.data.state ? activeRes.data.state : null;
            cloud.activeSnapshot = remoteActiveSnapshot || readActiveSessionFromLocal();
            writeActiveSessionToLocal(cloud.activeSnapshot);
            updateLocalCaches();
        }

        async function initCloud() {
            if (!window.BrainGymAuth || !window.BrainGymAuth.ready) {
                return {
                    settingsPayload: clone(settingsPayload),
                    activeSession: cloud.activeSnapshot ? clone(cloud.activeSnapshot) : null
                };
            }
            try {
                var auth = await window.BrainGymAuth.ready;
                if (!auth || !auth.client || !auth.user) {
                    return {
                        settingsPayload: clone(settingsPayload),
                        activeSession: cloud.activeSnapshot ? clone(cloud.activeSnapshot) : null
                    };
                }

                cloud.client = auth.client;
                cloud.userId = auth.user.id;
                cloud.ready = true;

                await ensureMigrationMark();
                await hydrateFromCloud();

                return {
                    settingsPayload: clone(settingsPayload),
                    activeSession: cloud.activeSnapshot ? clone(cloud.activeSnapshot) : null
                };
            } catch (error) {
                console.error('MathTrainerPersistence init failed:', error);
                return {
                    settingsPayload: clone(settingsPayload),
                    activeSession: cloud.activeSnapshot ? clone(cloud.activeSnapshot) : null
                };
            }
        }

        function loadSessions() {
            return sessions.slice();
        }

        function loadSolveTimes() {
            return solveTimes.slice();
        }

        function loadWrongAnswers() {
            return wrongAnswers.slice();
        }

        function loadSettingsPayload() {
            return clone(settingsPayload);
        }

        function saveSession(session) {
            sessions.push(session);
            sessions = trimEntries(sessions, maxEntries.sessions);
            writeJsonToLocal(storageKeys.SESSIONS, sessions);
            if (cloud.ready) {
                upsertMany('math_trainer_sessions', [sessionRow(session)]).catch(function (error) {
                    console.error('Failed to save session to cloud:', error);
                });
            }
        }

        function saveSolveTime(item) {
            solveTimes.push(item);
            solveTimes = trimEntries(solveTimes, maxEntries.solveTimes);
            writeJsonToLocal(storageKeys.SOLVE_TIMES, solveTimes);
            if (cloud.ready) {
                upsertMany('math_trainer_solve_times', [solveTimeRow(item)]).catch(function (error) {
                    console.error('Failed to save solve time to cloud:', error);
                });
            }
        }

        function saveWrongAnswer(item) {
            wrongAnswers.push(item);
            wrongAnswers = trimEntries(wrongAnswers, maxEntries.wrongAnswers);
            writeJsonToLocal(storageKeys.HISTORY, wrongAnswers);
            if (cloud.ready) {
                upsertMany('math_trainer_wrong_answers', [wrongAnswerRow(item)]).catch(function (error) {
                    console.error('Failed to save wrong answer to cloud:', error);
                });
            }
        }

        function saveSettingsPayload(payload) {
            settingsPayload = normalizeSettingsPayload(payload);
            writeJsonToLocal(storageKeys.SETTINGS, settingsPayload);
            if (cloud.ready) {
                cloud.client
                    .from('user_settings')
                    .upsert({
                        user_id: cloud.userId,
                        app_key: cloudKeys.SETTINGS_APP_KEY,
                        settings: settingsPayload
                    }, { onConflict: 'user_id,app_key' })
                    .then(function (response) {
                        if (response.error) {
                            console.error('Failed to save trainer settings to cloud:', response.error);
                        }
                    });
            }
        }

        function saveActiveSession(snapshot) {
            cloud.activeSnapshot = snapshot || null;
            writeActiveSessionToLocal(cloud.activeSnapshot);
            if (!cloud.ready) return;

            if (cloud.activeSaveTimer) clearTimeout(cloud.activeSaveTimer);
            cloud.activeSaveTimer = setTimeout(function () {
                cloud.activeSaveTimer = null;
                if (!cloud.activeSnapshot) {
                    cloud.client
                        .from('user_module_state')
                        .delete()
                        .eq('user_id', cloud.userId)
                        .eq('module_key', cloudKeys.ACTIVE_SESSION)
                        .then(function (response) {
                            if (response.error) console.error('Failed to clear active session state:', response.error);
                        });
                    return;
                }

                cloud.client
                    .from('user_module_state')
                    .upsert({
                        user_id: cloud.userId,
                        module_key: cloudKeys.ACTIVE_SESSION,
                        state: cloud.activeSnapshot
                    }, { onConflict: 'user_id,module_key' })
                    .then(function (response) {
                        if (response.error) console.error('Failed to save active session state:', response.error);
                    });
            }, 650);
        }

        function clearActiveSession() {
            saveActiveSession(null);
        }

        async function clearAllData() {
            sessions = [];
            solveTimes = [];
            wrongAnswers = [];
            settingsPayload = defaultSettingsPayload();
            cloud.activeSnapshot = null;
            if (cloud.activeSaveTimer) {
                clearTimeout(cloud.activeSaveTimer);
                cloud.activeSaveTimer = null;
            }
            writeActiveSessionToLocal(null);
            updateLocalCaches();

            if (!cloud.ready) return;

            await Promise.all([
                cloud.client.from('math_trainer_sessions').delete().eq('user_id', cloud.userId),
                cloud.client.from('math_trainer_solve_times').delete().eq('user_id', cloud.userId),
                cloud.client.from('math_trainer_wrong_answers').delete().eq('user_id', cloud.userId),
                cloud.client.from('user_settings').delete().eq('user_id', cloud.userId).eq('app_key', cloudKeys.SETTINGS_APP_KEY),
                cloud.client.from('user_module_state').delete().eq('user_id', cloud.userId).eq('module_key', cloudKeys.ACTIVE_SESSION),
                cloud.client.from('user_migrations').delete().eq('user_id', cloud.userId).eq('migration_key', cloudKeys.MIGRATION)
            ]);
        }

        return {
            initCloud: initCloud,
            loadSessions: loadSessions,
            loadSolveTimes: loadSolveTimes,
            loadWrongAnswers: loadWrongAnswers,
            loadSettingsPayload: loadSettingsPayload,
            saveSession: saveSession,
            saveSolveTime: saveSolveTime,
            saveWrongAnswer: saveWrongAnswer,
            saveSettingsPayload: saveSettingsPayload,
            saveActiveSession: saveActiveSession,
            clearActiveSession: clearActiveSession,
            clearAllData: clearAllData
        };
    }

    window.MathTrainerPersistence = {
        create: create
    };
})();
