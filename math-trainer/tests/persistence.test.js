const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PERSISTENCE_PATH = path.resolve(__dirname, '..', 'persistence.js');

const STORAGE_KEYS = {
    SESSIONS: 'mathTrainer_sessions',
    HISTORY: 'mathTrainer_history',
    SETTINGS: 'mathTrainer_settings',
    SOLVE_TIMES: 'mathTrainer_solveTimes'
};

const CLOUD_KEYS = {
    MIGRATION: 'math_trainer_localstorage_v1',
    ACTIVE_SESSION: 'math-trainer:active-session',
    SETTINGS_APP_KEY: 'math-trainer'
};

const DEFAULT_SETTINGS = {
    digitRange: 2,
    chainLength: 5,
    theme: 'default'
};

const DEFAULT_MIXED_CONFIG = {
    exponent: 2,
    multiplication: 2,
    addition: 2,
    subtraction: 2,
    division: 2
};

const ACTIVE_SESSION_STORAGE_KEY = STORAGE_KEYS.SETTINGS + ':activeSession';

function createMemoryStorage(seed) {
    const map = new Map(Object.entries(seed || {}));
    return {
        getItem(key) {
            return map.has(key) ? map.get(key) : null;
        },
        setItem(key, value) {
            map.set(key, String(value));
        },
        removeItem(key) {
            map.delete(key);
        },
        clear() {
            map.clear();
        }
    };
}

function buildSession(offsetMinutes, baseTimeMs) {
    return {
        mode: 'addition',
        correct: offsetMinutes,
        total: offsetMinutes + 1,
        accuracy: 100,
        avgTime: 1.5,
        bestTime: 1.1,
        timestamp: new Date(baseTimeMs + offsetMinutes * 60_000).toISOString(),
        times: [1.1, 1.5]
    };
}

function createMockClient(options) {
    const config = Object.assign({
        migrationMarked: true,
        remoteSessions: [],
        remoteSolveTimes: [],
        remoteWrongAnswers: [],
        remoteSettings: null,
        remoteActiveSession: null
    }, options || {});

    const queries = [];

    function finalizeQuery(state, op) {
        queries.push({
            op: op,
            table: state.table,
            select: state.select,
            order: state.order,
            limit: state.limit,
            filters: state.filters.slice()
        });
    }

    function tableData(table) {
        if (table === 'math_trainer_sessions') {
            return config.remoteSessions.map((payload) => ({ payload: payload }));
        }
        if (table === 'math_trainer_solve_times') {
            return config.remoteSolveTimes.map((payload) => ({ payload: payload }));
        }
        if (table === 'math_trainer_wrong_answers') {
            return config.remoteWrongAnswers.map((payload) => ({ payload: payload }));
        }
        return [];
    }

    return {
        queries,
        from(table) {
            const state = {
                table,
                select: null,
                order: null,
                limit: null,
                filters: []
            };

            const builder = {
                select(columns) {
                    state.select = columns;
                    return builder;
                },
                order(column, options) {
                    state.order = { column, options };
                    return builder;
                },
                limit(count) {
                    state.limit = count;
                    finalizeQuery(state, 'limit');
                    return Promise.resolve({ data: tableData(table), error: null });
                },
                eq(column, value) {
                    state.filters.push({ column, value });
                    return builder;
                },
                maybeSingle() {
                    finalizeQuery(state, 'maybeSingle');
                    if (table === 'user_migrations') {
                        return Promise.resolve({
                            data: config.migrationMarked ? { migration_key: CLOUD_KEYS.MIGRATION } : null,
                            error: null
                        });
                    }
                    if (table === 'user_settings') {
                        return Promise.resolve({
                            data: config.remoteSettings ? { settings: config.remoteSettings } : null,
                            error: null
                        });
                    }
                    if (table === 'user_module_state') {
                        return Promise.resolve({
                            data: config.remoteActiveSession ? { state: config.remoteActiveSession } : null,
                            error: null
                        });
                    }
                    return Promise.resolve({ data: null, error: null });
                },
                upsert() {
                    finalizeQuery(state, 'upsert');
                    return Promise.resolve({ data: null, error: null });
                },
                delete() {
                    finalizeQuery(state, 'delete');
                    return builder;
                },
                in() {
                    finalizeQuery(state, 'in');
                    return Promise.resolve({ data: null, error: null });
                }
            };

            return builder;
        }
    };
}

function bootPersistence(args) {
    const options = args || {};
    const storage = createMemoryStorage(options.seed || {});

    global.localStorage = storage;
    global.window = {};
    if (options.brainGymAuth !== undefined) {
        global.window.BrainGymAuth = options.brainGymAuth;
    }

    const source = fs.readFileSync(PERSISTENCE_PATH, 'utf8');
    vm.runInThisContext(source, { filename: PERSISTENCE_PATH });

    const persistence = global.window.MathTrainerPersistence.create({
        storageKeys: STORAGE_KEYS,
        cloudKeys: CLOUD_KEYS,
        defaultSettings: DEFAULT_SETTINGS,
        defaultMixedConfig: DEFAULT_MIXED_CONFIG
    });

    return { persistence, storage };
}

test.afterEach(() => {
    delete global.localStorage;
    delete global.window;
});

test('initCloud returns local active session when auth is unavailable', async () => {
    const activeSnapshot = {
        mode: 'addition',
        correct: 7,
        total: 10,
        startedAt: Date.now()
    };

    const seed = {
        [ACTIVE_SESSION_STORAGE_KEY]: JSON.stringify(activeSnapshot)
    };

    const { persistence } = bootPersistence({ seed });
    const hydrated = await persistence.initCloud();

    assert.deepEqual(hydrated.activeSession, activeSnapshot);
});

test('cloud hydration requests newest bounded windows in descending order', async () => {
    const client = createMockClient({});
    const { persistence } = bootPersistence({
        brainGymAuth: {
            ready: Promise.resolve({
                client,
                user: { id: 'user-1' }
            })
        }
    });

    await persistence.initCloud();

    const sessionQuery = client.queries.find((q) => q.table === 'math_trainer_sessions' && q.op === 'limit');
    const solveQuery = client.queries.find((q) => q.table === 'math_trainer_solve_times' && q.op === 'limit');
    const wrongQuery = client.queries.find((q) => q.table === 'math_trainer_wrong_answers' && q.op === 'limit');

    assert.ok(sessionQuery, 'expected sessions hydration query');
    assert.ok(solveQuery, 'expected solve-times hydration query');
    assert.ok(wrongQuery, 'expected wrong-answers hydration query');

    assert.equal(sessionQuery.order.column, 'session_timestamp');
    assert.equal(sessionQuery.order.options.ascending, false);
    assert.equal(solveQuery.order.column, 'solve_timestamp');
    assert.equal(solveQuery.order.options.ascending, false);
    assert.equal(wrongQuery.order.column, 'answered_at');
    assert.equal(wrongQuery.order.options.ascending, false);
});

test('session merge keeps latest 100 by timestamp after cloud hydration', async () => {
    const baseTimeMs = Date.UTC(2026, 0, 1, 0, 0, 0);
    const localSessions = [];
    const remoteSessions = [];

    for (let i = 240; i < 300; i += 1) {
        localSessions.push(buildSession(i, baseTimeMs));
    }
    for (let i = 0; i < 60; i += 1) {
        remoteSessions.push(buildSession(i, baseTimeMs));
    }

    const seed = {
        [STORAGE_KEYS.SESSIONS]: JSON.stringify(localSessions)
    };

    const client = createMockClient({
        remoteSessions: remoteSessions
    });

    const { persistence } = bootPersistence({
        seed,
        brainGymAuth: {
            ready: Promise.resolve({
                client,
                user: { id: 'user-1' }
            })
        }
    });

    await persistence.initCloud();

    const merged = persistence.loadSessions();
    const offsets = merged
        .map((item) => Math.round((Date.parse(item.timestamp) - baseTimeMs) / 60_000))
        .sort((a, b) => a - b);

    assert.equal(merged.length, 100);
    assert.equal(offsets[0], 20);
    assert.equal(offsets[offsets.length - 1], 299);
});

test('active session is written to local storage immediately', () => {
    const { persistence, storage } = bootPersistence({});
    const snapshot = {
        mode: 'chain',
        correct: 3,
        total: 4,
        startedAt: Date.now()
    };

    persistence.saveActiveSession(snapshot);
    assert.deepEqual(JSON.parse(storage.getItem(ACTIVE_SESSION_STORAGE_KEY)), snapshot);

    persistence.clearActiveSession();
    assert.equal(storage.getItem(ACTIVE_SESSION_STORAGE_KEY), null);
});
