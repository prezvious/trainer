/**
 * Brain Gym module-level local persistence helper.
 * Stores per-module UI/session state in localStorage.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'brainGymModuleState_v1';

    function safeParse(raw, fallback) {
        if (!raw) return fallback;
        try {
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (_) {
            return fallback;
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

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            if (value && typeof value === 'object') {
                try { return Object.assign(Array.isArray(value) ? [] : {}, value); } catch (_e) { /* fall through */ }
            }
            return value;
        }
    }

    function load(moduleKey, fallback) {
        if (!moduleKey || typeof moduleKey !== 'string') return clone(fallback);
        var store = readStore();
        var entry = store[moduleKey];
        if (!entry || typeof entry !== 'object' || !('state' in entry)) {
            return clone(fallback);
        }
        return clone(entry.state);
    }

    function save(moduleKey, state) {
        if (!moduleKey || typeof moduleKey !== 'string') return;
        var store = readStore();
        store[moduleKey] = {
            updatedAt: Date.now(),
            state: clone(state)
        };
        writeStore(store);
    }

    function clear(moduleKey) {
        if (!moduleKey || typeof moduleKey !== 'string') return;
        var store = readStore();
        if (!Object.prototype.hasOwnProperty.call(store, moduleKey)) return;
        delete store[moduleKey];
        writeStore(store);
    }

    window.BrainGymModuleState = {
        load: load,
        save: save,
        clear: clear
    };
})();
