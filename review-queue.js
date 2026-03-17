/**
 * Brain Gym spaced repetition queue (local-only).
 * Tracks due items for formulas, vocabulary, and grammar cards.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'brainGymReviewQueue_v1';
    var DAY_MS = 24 * 60 * 60 * 1000;

    var INTERVALS_BY_TYPE = {
        formula: [0, 1, 3, 7, 14, 30, 60],
        vocab: [0, 1, 2, 4, 7, 14, 30, 60],
        grammar: [0, 1, 3, 6, 10, 18, 30, 45]
    };

    function safeParse(raw, fallback) {
        if (!raw) return fallback;
        try {
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return value;
        }
    }

    function readStore() {
        try {
            return safeParse(localStorage.getItem(STORAGE_KEY), {});
        } catch (_) {
            return {};
        }
    }

    function writeStore(store) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store || {}));
        } catch (_) {
            // Ignore storage failures.
        }
    }

    function normalizeType(type) {
        if (type === 'formula' || type === 'vocab' || type === 'grammar') return type;
        return 'vocab';
    }

    function getIntervals(type) {
        var normalized = normalizeType(type);
        return INTERVALS_BY_TYPE[normalized] || INTERVALS_BY_TYPE.vocab;
    }

    function clampStage(type, stage) {
        var intervals = getIntervals(type);
        var maxStage = intervals.length - 1;
        var n = Number(stage);
        if (!Number.isFinite(n)) return 0;
        return Math.max(0, Math.min(maxStage, Math.floor(n)));
    }

    function nextDueAt(type, stage, fromTime) {
        var safeType = normalizeType(type);
        var intervals = getIntervals(safeType);
        var safeStage = clampStage(safeType, stage);
        var days = intervals[safeStage] || 0;
        return Number(fromTime) + days * DAY_MS;
    }

    function sanitizeItem(raw) {
        if (!raw || typeof raw !== 'object') return null;
        if (!raw.id || typeof raw.id !== 'string') return null;
        if (!raw.title || typeof raw.title !== 'string') return null;
        if (!raw.href || typeof raw.href !== 'string') return null;

        var type = normalizeType(raw.type);
        var now = Date.now();
        var stage = clampStage(type, raw.stage);
        var createdAt = Number(raw.createdAt);
        if (!Number.isFinite(createdAt) || createdAt <= 0) createdAt = now;

        var dueAt = Number(raw.dueAt);
        if (!Number.isFinite(dueAt) || dueAt <= 0) {
            dueAt = nextDueAt(type, stage, now);
        }

        return {
            id: raw.id,
            type: type,
            title: raw.title,
            subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
            href: raw.href,
            stage: stage,
            dueAt: dueAt,
            createdAt: createdAt,
            lastSeenAt: Number(raw.lastSeenAt) || createdAt,
            lastReviewedAt: Number(raw.lastReviewedAt) || 0,
            reviewCount: Number(raw.reviewCount) > 0 ? Math.floor(Number(raw.reviewCount)) : 0
        };
    }

    function getItem(id) {
        if (!id || typeof id !== 'string') return null;
        var store = readStore();
        var item = sanitizeItem(store[id]);
        if (!item) return null;
        return item;
    }

    function putItem(item) {
        var safe = sanitizeItem(item);
        if (!safe) return null;
        var store = readStore();
        store[safe.id] = safe;
        writeStore(store);
        return clone(safe);
    }

    function seed(item) {
        var safe = sanitizeItem(item);
        if (!safe) return null;

        var store = readStore();
        var now = Date.now();
        var existing = sanitizeItem(store[safe.id]);

        if (!existing) {
            safe.createdAt = now;
            safe.lastSeenAt = now;
            safe.lastReviewedAt = 0;
            safe.reviewCount = 0;
            safe.stage = 0;
            safe.dueAt = now;
            store[safe.id] = safe;
            writeStore(store);
            return clone(safe);
        }

        existing.title = safe.title;
        existing.subtitle = safe.subtitle;
        existing.href = safe.href;
        existing.lastSeenAt = now;
        store[safe.id] = existing;
        writeStore(store);
        return clone(existing);
    }

    function markReviewed(id, quality) {
        var store = readStore();
        var item = sanitizeItem(store[id]);
        if (!item) return null;

        var validQualities = { again: true, hard: true, good: true, easy: true };
        var safeQuality = validQualities[quality] ? quality : 'good';

        var now = Date.now();
        var nextStage = item.stage;
        if (safeQuality === 'again') {
            nextStage = Math.max(item.stage - 1, 0);
        } else if (safeQuality === 'hard') {
            nextStage = item.stage;
        } else {
            nextStage = item.stage + 1;
        }

        item.stage = clampStage(item.type, nextStage);
        item.reviewCount = (item.reviewCount || 0) + 1;
        item.lastSeenAt = now;
        item.lastReviewedAt = now;
        item.dueAt = nextDueAt(item.type, item.stage, now);

        store[id] = item;
        writeStore(store);
        return clone(item);
    }

    function remove(id) {
        var store = readStore();
        if (!Object.prototype.hasOwnProperty.call(store, id)) return;
        delete store[id];
        writeStore(store);
    }

    function listAll() {
        var store = readStore();
        var ids = Object.keys(store);
        return ids
            .map(function (id) { return sanitizeItem(store[id]); })
            .filter(Boolean)
            .sort(function (a, b) { return a.dueAt - b.dueAt; });
    }

    function getDueItems(limit) {
        var now = Date.now();
        var max = Number(limit);
        if (!Number.isFinite(max) || max <= 0) max = 8;

        return listAll()
            .filter(function (item) { return item.dueAt <= now; })
            .slice(0, max)
            .map(clone);
    }

    function getSummary() {
        var all = listAll();
        var now = Date.now();
        var dueCount = 0;
        var nextDueAt = null;

        all.forEach(function (item) {
            if (item.dueAt <= now) {
                dueCount += 1;
                return;
            }
            if (nextDueAt === null || item.dueAt < nextDueAt) {
                nextDueAt = item.dueAt;
            }
        });

        return {
            totalCount: all.length,
            dueCount: dueCount,
            nextDueAt: nextDueAt
        };
    }

    function formulaId(formulaKey) {
        return 'formula:' + String(formulaKey || '').trim().toLowerCase();
    }

    function vocabId(word) {
        return 'vocab:' + String(word || '').trim().toLowerCase();
    }

    function grammarId(cardId) {
        return 'grammar:' + String(cardId || '').trim().toLowerCase();
    }

    window.BrainGymReviewQueue = {
        formulaId: formulaId,
        vocabId: vocabId,
        grammarId: grammarId,
        seed: seed,
        markReviewed: markReviewed,
        remove: remove,
        getItem: getItem,
        getDueItems: getDueItems,
        getSummary: getSummary
    };
})();
