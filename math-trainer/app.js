/**
 * Mental Math Trainer
 * A comprehensive mental arithmetic training application with
 * speedcubing-style analytics and persistent progress tracking.
 */

// ============================================
// Constants & Configuration
// ============================================

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

function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}

const OPERATIONS = {
    multiplication: { symbol: '×', name: 'Multiplication' },
    addition: { symbol: '+', name: 'Addition' },
    subtraction: { symbol: '−', name: 'Subtraction' },
    division: { symbol: '÷', name: 'Division' },
    mixed: { symbol: '?', name: 'Mixed' },
    chain: { symbol: '⟶', name: 'Chain Math' },
    algebra: { symbol: 'x', name: 'Algebra' },
    pemdas: { symbol: '()', name: 'PEMDAS' },
    square: { symbol: '²', name: 'Square' },
    sqrt: { symbol: '√', name: 'Square Root' },
    gcf: { symbol: 'GCF', name: 'GCF' },
    lcm: { symbol: 'LCM', name: 'LCM' },
    pattern: { symbol: '…', name: 'Number Pattern' },
    comparison: { symbol: ':', name: 'Comparison' }
};

const DEFAULT_SETTINGS = {
    digitRange: 2,
    chainLength: 5,
    theme: "default"
};

// Mixed mode difficulty levels: maps level -> max number
const MIXED_DIFFICULTIES = {
    0: 0,    // Don't Train
    1: 9,    // Warm Up
    2: 50,   // Easy
    3: 100,  // Medium
    4: 250,  // Hard
    5: 500   // Extra Hard
};

// Default mixed mode configuration
const DEFAULT_MIXED_CONFIG = {
    exponent: 2,
    multiplication: 2,
    addition: 2,
    subtraction: 2,
    division: 2
};

// ============================================
// State Management
// ============================================

const state = {
    currentScreen: 'home',
    currentMode: null,
    timeLimit: 30,

    // Session state
    session: {
        active: false,
        problems: [],
        currentProblem: null,
        correct: 0,
        total: 0,
        times: [],
        startTime: null,
        timerInterval: null
    },

    // Chain Math state
    chain: {
        numbers: [],
        currentIndex: 0,
        displayTimeout: null,
        displayRunId: 0,
        isDisplaying: false
    },

    // Settings
    settings: { ...DEFAULT_SETTINGS },

    // Mixed mode per-operation difficulty config
    mixedConfig: { ...DEFAULT_MIXED_CONFIG },

    // Advanced Configuration
    config: {
        verticalAlign: true,
        digitA: 1, // Number of digits for first operand
        digitB: 1, // Number of digits for second operand
        divisionLevel: 2, // 1=WarmUp, ... 5=ExtraHard
        pendingMode: null, // Store mode while configuring
        gcfDifficulty: 2,   // 1=Easy, 2=Medium, 3=Hard
        lcmDifficulty: 2,
        patternDifficulty: 2,
        gcfNumberCount: 2,
        lcmNumberCount: 2
    }
};

// ============================================
// DOM Elements
// ============================================

const elements = {
    screens: {
        home: document.getElementById('home-screen'),
        practice: document.getElementById('practice-screen'),
        complete: document.getElementById('complete-screen'),
        analytics: document.getElementById('analytics-screen'),
        history: document.getElementById('history-screen'),
        settings: document.getElementById('settings-screen'),
        power: document.getElementById('power-screen'),
        multiplication: document.getElementById('multiplication-screen'),
        algebra: document.getElementById('algebra-screen'),
        prime: document.getElementById('prime-screen')
    },

    // Power Table elements
    powerHeaderRow: document.getElementById('power-header-row'),
    powerTableBody: document.getElementById('power-table-body'),

    // Home screen
    modeButtons: document.querySelectorAll('.mode-btn'),
    timeButtons: document.querySelectorAll('.time-btn'),

    // Practice screen
    currentMode: document.getElementById('current-mode'),
    sessionProgress: document.getElementById('session-progress'),
    timerFill: document.getElementById('timer-fill'),
    timerText: document.getElementById('timer-text'),
    problemDisplay: document.getElementById('problem-display'),
    chainDisplay: document.getElementById('chain-display'),
    chainNumbers: document.getElementById('chain-numbers'),
    chainProgress: document.getElementById('chain-progress'),
    answerInput: document.getElementById('answer-input'),
    answerFeedback: document.getElementById('answer-feedback'),
    statCorrect: document.getElementById('stat-correct'),
    statAccuracy: document.getElementById('stat-accuracy'),
    statAvgTime: document.getElementById('stat-avg-time'),

    // Complete screen
    completeScore: document.getElementById('complete-score'),
    completeAccuracy: document.getElementById('complete-accuracy'),
    completeAvgTime: document.getElementById('complete-avg-time'),
    completeBestTime: document.getElementById('complete-best-time'),

    // Analytics screen (Keep existing...)
    ao5Value: document.getElementById('ao5-value'),
    ao12Value: document.getElementById('ao12-value'),
    totalProblems: document.getElementById('total-problems'),
    overallAccuracy: document.getElementById('overall-accuracy'),
    overallAvgTime: document.getElementById('overall-avg-time'),
    personalBest: document.getElementById('personal-best'),
    operationStats: document.getElementById('operation-stats'),

    // History screen
    sessionsList: document.getElementById('sessions-list'),
    wrongList: document.getElementById('wrong-list'),

    // Settings
    digitRange: document.getElementById('digit-range'),
    chainLength: document.getElementById('chain-length'),

    // Setup Modal
    setupModal: document.getElementById('setup-modal'),
    setupTitle: document.getElementById('setup-title'),
    digitSelectionContainer: document.getElementById('digit-selection-container'),
    digitGrid: document.getElementById('digit-grid'),
    divisionLevelContainer: document.getElementById('division-level-container'),
    setupStartBtn: document.getElementById('setup-start-btn'),
    setupCancelBtn: document.getElementById('setup-cancel-btn'),
    levelButtons: document.querySelectorAll('.level-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),

    // GCF/LCM/Pattern Setup
    gcfLcmLevelContainer: document.getElementById('gcf-lcm-level-container'),
    gcfLcmLevelButtons: document.querySelectorAll('.gcf-lcm-level-btn'),
    numberCountContainer: document.getElementById('number-count-container'),
    countButtons: document.querySelectorAll('.count-btn')
};

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get maximum number based on digit range setting
 */
function getMaxNumber() {
    const ranges = { 1: 9, 2: 99, 3: 999 };
    return ranges[state.settings.digitRange] || 99;
}

/**
 * Format time in seconds to display string
 */
function formatTime(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
        return '--';
    }
    return seconds.toFixed(2) + 's';
}

/**
 * Format date to readable string
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// Problem Generation
// ============================================

/**
 * Generate an exponent problem (base^exp)
 */
function generateExponentProblem(max) {
    // For exponents, limit base to a reasonable range
    const maxBase = Math.min(max, 20);
    const base = randomInt(2, maxBase);
    const exp = randomInt(2, 3); // Only squares and cubes
    const answer = Math.pow(base, exp);
    const displayText = `${base}${exp === 2 ? '²' : '³'}`;

    return {
        a: base,
        b: exp,
        answer,
        symbol: '^',
        operation: 'exponent',
        displayText
    };
}

/**
 * Generate a math problem based on operation type
 */
function generateProblem(mode) {
    let max = getMaxNumber();
    let a, b, answer, symbol, operation;
    let displayText, contextText;
    let attempts = 0;

    do {
        attempts++;
        operation = mode;

        // Handle mixed mode by randomly selecting an enabled operation
        if (operation === 'mixed') {
            const enabledOps = [];
            if (state.mixedConfig.exponent > 0) enabledOps.push('exponent');
            if (state.mixedConfig.multiplication > 0) enabledOps.push('multiplication');
            if (state.mixedConfig.addition > 0) enabledOps.push('addition');
            if (state.mixedConfig.subtraction > 0) enabledOps.push('subtraction');
            if (state.mixedConfig.division > 0) enabledOps.push('division');

            if (enabledOps.length === 0) {
                // Fallback if nothing enabled
                enabledOps.push('addition');
            }

            operation = enabledOps[randomInt(0, enabledOps.length - 1)];

            // Use per-operation max from mixedConfig
            const diffLevel = state.mixedConfig[operation] || 2;
            max = MIXED_DIFFICULTIES[diffLevel] || 50;
        }

        // Handle exponent separately
        if (operation === 'exponent') {
            const problem = generateExponentProblem(max);
            displayText = problem.displayText;
            a = problem.a;
            b = problem.b;
            answer = problem.answer;
            symbol = problem.symbol;
        } else if (operation === 'square') {
            a = randomInt(2, 35);
            b = 2;
            answer = a * a;
            symbol = '²';
            displayText = `${a}²`;
        } else if (operation === 'sqrt') {
            const root = randomInt(2, 35);
            a = root * root;
            b = 2; // Not really used but good for consistency
            answer = root;
            symbol = '√';
            displayText = `√${a}`;
        } else if (operation === 'gcf') {
            const problem = generateGCFProblem();
            a = problem.a;
            b = problem.b;
            answer = problem.answer;
            symbol = 'GCF';
            displayText = problem.displayText;
        } else if (operation === 'lcm') {
            const problem = generateLCMProblem();
            a = problem.a;
            b = problem.b;
            answer = problem.answer;
            symbol = 'LCM';
            displayText = problem.displayText;
        } else if (operation === 'pattern') {
            const problem = generatePatternProblem();
            a = problem.a;
            b = problem.b;
            answer = problem.answer;
            symbol = '…';
            displayText = problem.displayText;
        } else if (operation === 'comparison') {
            const problem = generateComparisonProblem();
            a = problem.a;
            b = problem.b;
            answer = problem.answer;
            symbol = ':';
            displayText = problem.displayText;
            contextText = problem.contextText;
        } else if (operation === 'pemdas') {
            // PEMDAS: brackets, multiply, divide, add, subtract, exponent
            // Numbers range 1-20, integer results only, negatives allowed
            const pattern = randomInt(0, 7);
            let expr, res;

            // Helper: safe division pair (dividend, divisor) -> integer result
            function safeDivPair(minQ, maxQ, minD, maxD) {
                const d = randomInt(minD, maxD);
                const q = randomInt(minQ, maxQ);
                return { dividend: d * q, divisor: d, quotient: q };
            }

            // Helper: safe exponent (base^exp with integer result, reasonable size)
            function safeExp() {
                const base = randomInt(1, 5);
                const exp = randomInt(2, 3);
                return { base, exp, result: Math.pow(base, exp) };
            }

            // Pattern 0: (a + b) × c − d
            if (pattern === 0) {
                let aa = randomInt(1, 20), bb = randomInt(1, 20);
                let cc = randomInt(1, 10), dd = randomInt(1, 20);
                res = (aa + bb) * cc - dd;
                expr = `(${aa} + ${bb}) \\times ${cc} - ${dd}`;
            }
            // Pattern 1: a × b ÷ c + d (a×b divisible by c)
            else if (pattern === 1) {
                let cc = randomInt(2, 10);
                let product = cc * randomInt(1, 10);
                let aa = randomInt(1, 20), bb;
                // Find factors
                for (let tries = 0; tries < 20; tries++) {
                    aa = randomInt(1, 20);
                    if (product % aa === 0) break;
                }
                bb = product / aa || randomInt(1, 10);
                if (!Number.isInteger(bb) || bb < 1) { aa = cc; bb = randomInt(1, 10); product = aa * bb; }
                let dd = randomInt(1, 20);
                res = Math.floor(product / cc) + dd;
                expr = `${aa} \\times ${Math.round(product / aa)} \\div ${cc} + ${dd}`;
                let divResult = Math.round(product / cc);
                res = divResult + dd;
            }
            // Pattern 2: a² + b × c
            else if (pattern === 2) {
                let e = safeExp();
                let bb = randomInt(1, 10), cc = randomInt(1, 10);
                res = e.result + bb * cc;
                expr = `${e.base}^{${e.exp}} + ${bb} \\times ${cc}`;
            }
            // Pattern 3: (a − b) × (c + d)
            else if (pattern === 3) {
                let aa = randomInt(1, 20), bb = randomInt(1, 20);
                let cc = randomInt(1, 15), dd = randomInt(1, 15);
                res = (aa - bb) * (cc + dd);
                expr = `(${aa} - ${bb}) \\times (${cc} + ${dd})`;
            }
            // Pattern 4: a × (b − c) ÷ d  (ensure a×(b-c) divisible by d)
            else if (pattern === 4) {
                let bb = randomInt(1, 20), cc = randomInt(1, 20);
                let inner = bb - cc;
                let dd = randomInt(2, 5);
                let aa = dd * randomInt(1, 5);
                let product = aa * inner;
                if (inner === 0) { inner = 1; bb = cc + 1; product = aa; }
                if (product % dd !== 0) { aa = dd; product = dd * inner; }
                res = Math.floor(product / dd);
                expr = `${aa} \\times (${bb} - ${cc}) \\div ${dd}`;
            }
            // Pattern 5: a³ − b × c + d
            else if (pattern === 5) {
                let e = safeExp();
                let bb = randomInt(1, 10), cc = randomInt(1, 10), dd = randomInt(1, 20);
                res = e.result - bb * cc + dd;
                expr = `${e.base}^{${e.exp}} - ${bb} \\times ${cc} + ${dd}`;
            }
            // Pattern 6: (a + b)² ÷ c  (ensure (a+b)² divisible by c)
            else if (pattern === 6) {
                let aa = randomInt(1, 6), bb = randomInt(1, 6);
                let sum = aa + bb;
                let sq = sum * sum;
                // Pick a divisor that divides sq
                let divisors = [];
                for (let i = 2; i <= Math.min(sq, 15); i++) { if (sq % i === 0) divisors.push(i); }
                let cc = divisors.length > 0 ? divisors[randomInt(0, divisors.length - 1)] : 1;
                res = sq / cc;
                expr = `(${aa} + ${bb})^{2} \\div ${cc}`;
            }
            // Pattern 7: a × b + c² − d
            else {
                let aa = randomInt(1, 10), bb = randomInt(1, 10);
                let e = safeExp();
                let dd = randomInt(1, 20);
                res = aa * bb + e.result - dd;
                expr = `${aa} \\times ${bb} + ${e.base}^{${e.exp}} - ${dd}`;
            }

            answer = res;
            displayText = expr;
            symbol = '()';
        } else if (operation === 'algebra') {
            const ops = ['addition', 'subtraction', 'multiplication', 'division'];
            const subOp = ops[randomInt(0, ops.length - 1)];

            if (subOp === 'multiplication') {
                a = randomInt(2, 12);
                b = randomInt(2, 12);
                symbol = '×';
            } else if (subOp === 'division') {
                b = randomInt(2, 12);
                const quotient = randomInt(2, 12);
                a = b * quotient;
                symbol = '÷';
            } else {
                a = randomInt(5, 50);
                b = randomInt(2, a);
                symbol = subOp === 'subtraction' ? '−' : '+';
            }

            const result = (subOp === 'division') ? a / b :
                (subOp === 'multiplication') ? a * b :
                    (subOp === 'subtraction') ? a - b :
                        a + b;

            const missing = randomInt(0, 1); // 0 = hide a, 1 = hide b

            if (missing === 0) {
                answer = a;
                displayText = `? ${symbol} ${b} = ${result}`;
            } else {
                answer = b;
                displayText = `${a} ${symbol} ? = ${result}`;
            }
        } else if (operation === 'division' && mode !== 'mixed') {
            // Division Difficulty Levels
            // 1: Warm Up (Table 1-9)
            // 2: Easy (Table 1-12)
            // 3: Medium (2 digit / 1 digit)
            // 4: Hard (4 digit / 1-2 digit)
            // 5: Extra Hard (5 digit / 1-4 digit)
            const level = state.config.divisionLevel;

            let maxDivisor = 9;
            let maxQuotient = 9;

            // Default behaviors for table-based levels
            if (level === 2) { maxDivisor = 12; maxQuotient = 12; }

            if (level === 3) {
                // Medium: 2 digit dividend / 1 digit divisor
                // Requirement: "pembagian dua digit dengan satu digit"
                // Dividend: 10-99. Divisor: 2-9.
                // To ensure clean division, we pick divisor (b) and quotient (answer)
                // such that a = b * answer is within range [10, 99].

                b = randomInt(2, 9); // Divisor (1 digit)

                // Max quotient possible to keep 'a' <= 99 is floor(99 / b)
                // Min quotient to keep 'a' >= 10 is ceil(10 / b)
                const minQ = Math.ceil(10 / b);
                const maxQ = Math.floor(99 / b);

                if (minQ <= maxQ) {
                    answer = randomInt(minQ, maxQ);
                } else {
                    // Fallback if odd constraints (shouldn't happen for 2-9)
                    answer = randomInt(1, 10);
                }

                a = b * answer;

            } else if (level === 4) {
                // Hard: 4 digit dividend / divisor range 2 digit & 1 digit
                // Requirement: "pembagian 4 digit dengan range antara 2 digit dan 1 digit"
                // Dividend: 1000-9999. Divisor: 2-99.

                // Pick meaningful divisor
                b = randomInt(2, 99);

                // Determine valid quotient range so 'a' is 4 digits [1000, 9999]
                const minQ = Math.ceil(1000 / b);
                const maxQ = Math.floor(9999 / b);

                if (minQ <= maxQ) {
                    answer = randomInt(minQ, maxQ);
                } else {
                    // Fallback logic if 4 digits not reachable (e.g. b=2, minQ=500, maxQ=4999 - valid)
                    // If b=99, minQ=11, maxQ=101. Valid.
                    answer = randomInt(10, 100);
                }

                a = b * answer;

            } else if (level === 5) {
                // Extra Hard: 5 digit dividend / divisor range 4 digit - 1 digit
                // Modulo Integration: 20% chance
                if (Math.random() < 0.2) {
                    b = randomInt(3, 12);
                    a = randomInt(b + 1, b * 5);
                    answer = a % b;
                    symbol = '%';
                    displayText = `${a} mod ${b}`;
                    // Prevent symbol override
                    operation = 'modulo';
                } else {
                    b = randomInt(2, 9999);
                    const minQ = Math.ceil(10000 / b);
                    const maxQ = Math.floor(99999 / b);
                    if (minQ <= maxQ) {
                        answer = randomInt(minQ, maxQ);
                    } else {
                        answer = randomInt(1, 100);
                    }
                    a = b * answer;
                }
            } else if (level <= 2) {
                // Level 1 & 2 (Tables)
                b = randomInt(2, maxDivisor);
                answer = randomInt(2, maxQuotient);
                a = b * answer;
            } else {
                // Fallback mechanism
                b = randomInt(2, 9);
                answer = randomInt(2, 9);
                a = b * answer;
            }

            // Final safety: ensure a is computed
            if (!a) a = b * answer;

        } else {
            // Use digit config for non-mixed modes, mixed uses its own max
            let minA = 1, maxA = max, minB = 1, maxB = max;
            if (mode !== 'mixed' && ['multiplication', 'addition', 'subtraction'].includes(operation)) {
                maxA = Math.pow(10, state.config.digitA) - 1;
                minA = Math.max(1, Math.pow(10, state.config.digitA - 1));
                maxB = Math.pow(10, state.config.digitB) - 1;
                minB = Math.max(1, Math.pow(10, state.config.digitB - 1));
            }

            switch (operation) {
                case 'multiplication':
                    a = randomInt(Math.max(2, minA), maxA);
                    b = randomInt(Math.max(2, minB), maxB);
                    break;
                case 'addition':
                    a = randomInt(minA, maxA);
                    b = randomInt(minB, maxB);
                    break;
                case 'subtraction':
                    a = randomInt(minA, maxA);
                    b = randomInt(minB, Math.min(maxB, a));
                    break;
                default: // division fallback handled in structure
                    b = randomInt(2, Math.min(max, 50));
                    answer = randomInt(1, Math.min(max, 50));
                    a = b * answer;
            }
        }

        // Swap to ensure positive answer for subtraction
        if (operation === 'subtraction' && a < b) {
            [a, b] = [b, a];
        }

        // Calculate Answer if not yet done (for Multi/Add/Sub override)
        if (operation === 'multiplication') { answer = a * b; symbol = '×'; }
        if (operation === 'addition') { answer = a + b; symbol = '+'; }
        if (operation === 'subtraction') { answer = a - b; symbol = '−'; }
        if (operation === 'division') { symbol = '÷'; /* Answer calc'd above */ }

        if (!displayText) displayText = `${a} ${symbol} ${b}`;

    } while (attempts < 50 && state.session && state.session.usedProblems && state.session.usedProblems.has(displayText));

    // Register the problem as used
    if (state.session && state.session.usedProblems) {
        state.session.usedProblems.add(displayText);
    }

    return {
        a,
        b,
        answer,
        symbol,
        operation,
        displayText,
        contextText
    };
}

// ============================================
// GCF Problem Generation
// ============================================

/**
 * Compute GCF of two numbers using Euclidean algorithm
 */
function gcd(a, b) {
    while (b) { [a, b] = [b, a % b]; }
    return a;
}

/**
 * Compute GCF of an array of numbers
 */
function gcdArray(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((acc, val) => gcd(acc, val));
}

/**
 * Compute LCM of two numbers
 */
function lcm(a, b) {
    return (a / gcd(a, b)) * b;
}

/**
 * Compute LCM of an array of numbers
 */
function lcmArray(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((acc, val) => lcm(acc, val));
}

/**
 * Generate a GCF problem based on current difficulty and number count
 */
function generateGCFProblem() {
    const difficulty = state.config.gcfDifficulty;
    const count = state.config.gcfNumberCount;
    let targetGCF, numbers;

    if (difficulty === 1) {
        // Easy: GCF is 5–15, numbers 10–100
        targetGCF = randomInt(5, 15);
        numbers = generateCoprimeMults(targetGCF, count, 2, Math.floor(100 / targetGCF));
    } else if (difficulty === 2) {
        // Medium: GCF is 3–25, numbers 20–500
        targetGCF = randomInt(3, 25);
        numbers = generateCoprimeMults(targetGCF, count, 2, Math.floor(500 / targetGCF));
    } else {
        // Hard: GCF can be 1–30, numbers 50–2000
        targetGCF = randomInt(1, 30);
        const maxMult = Math.min(Math.floor(2000 / targetGCF), 200);
        numbers = generateCoprimeMults(targetGCF, count, 2, maxMult);
    }

    const prompts = [
        `Find the GCF of ${numbers.join(', ')}`,
        `GCF(${numbers.join(', ')}) = ?`,
        `What is the greatest common factor of ${numbers.join(' and ')}?`,
        `Determine the GCF: ${numbers.join(', ')}`,
        `Calculate GCF(${numbers.join(', ')})`
    ];

    return {
        a: numbers[0],
        b: numbers[1] || 0,
        answer: targetGCF,
        displayText: prompts[randomInt(0, prompts.length - 1)]
    };
}

/**
 * Generate `count` multipliers that are pairwise coprime, then multiply each by targetGCF.
 * This guarantees the actual GCF of the resulting numbers equals targetGCF.
 */
function generateCoprimeMults(targetGCF, count, minMult, maxMult) {
    maxMult = Math.max(minMult + count, maxMult);
    const mults = [];
    let attempts = 0;

    while (mults.length < count && attempts < 200) {
        attempts++;
        const m = randomInt(minMult, maxMult);
        // Check pairwise coprime with all existing multipliers
        if (mults.every(existing => gcd(existing, m) === 1)) {
            mults.push(m);
        }
    }

    // Fallback: if we couldn't find enough coprime multipliers, use small primes
    const fallbackPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    while (mults.length < count) {
        for (const p of fallbackPrimes) {
            if (mults.length >= count) break;
            if (mults.every(existing => gcd(existing, p) === 1)) {
                mults.push(p);
            }
        }
        break; // prevent infinite loop
    }

    return mults.map(m => m * targetGCF);
}

// ============================================
// LCM Problem Generation
// ============================================

/**
 * Generate an LCM problem based on current difficulty and number count
 */
function generateLCMProblem() {
    const difficulty = state.config.lcmDifficulty;
    const count = state.config.lcmNumberCount;
    let numbers, answer;
    let attempts = 0;

    do {
        attempts++;
        numbers = [];
        if (difficulty === 1) {
            // Easy: 2 small numbers, LCM ≤ 200
            for (let i = 0; i < count; i++) numbers.push(randomInt(2, 20));
        } else if (difficulty === 2) {
            // Medium: numbers 5–50, LCM ≤ 2000
            for (let i = 0; i < count; i++) numbers.push(randomInt(5, 50));
        } else {
            // Hard: numbers 10–100, LCM ≤ 10000
            for (let i = 0; i < count; i++) numbers.push(randomInt(10, 100));
        }
        answer = lcmArray(numbers);
    } while (
        attempts < 50 && (
            (difficulty === 1 && answer > 200) ||
            (difficulty === 2 && answer > 2000) ||
            (difficulty === 3 && answer > 10000) ||
            // Avoid trivial cases where all numbers are the same
            new Set(numbers).size < Math.min(count, 2)
        )
    );

    const prompts = [
        `Find the LCM of ${numbers.join(', ')}`,
        `LCM(${numbers.join(', ')}) = ?`,
        `What is the least common multiple of ${numbers.join(' and ')}?`,
        `Determine the LCM: ${numbers.join(', ')}`,
        `Calculate LCM(${numbers.join(', ')})`
    ];

    return {
        a: numbers[0],
        b: numbers[1] || 0,
        answer: answer,
        displayText: prompts[randomInt(0, prompts.length - 1)]
    };
}

// ============================================
// Number Pattern Problem Generation
// ============================================

/**
 * Generate a number pattern problem based on current difficulty
 */
function generatePatternProblem(depth) {
    if ((depth || 0) >= 50) {
        // Fallback: simple arithmetic pattern
        const d = randomInt(2, 8), s = randomInt(1, 20), len = 6;
        const seq = [];
        for (let i = 0; i < len; i++) seq.push(s + d * i);
        const hideIdx = len - 1;
        return { display: seq.map((v, i) => i === hideIdx ? '?' : v).join(', '), answer: seq[hideIdx] };
    }
    const difficulty = state.config.patternDifficulty;
    let patternTypes;

    if (difficulty === 1) {
        patternTypes = ['arithmetic', 'geometric', 'squares'];
    } else if (difficulty === 2) {
        patternTypes = ['arithmetic', 'geometric', 'fibonacci', 'primes', 'alternating', 'squares'];
    } else {
        patternTypes = ['arithmetic', 'geometric', 'fibonacci', 'primes', 'alternating', 'polynomial', 'multistep', 'twovariable'];
    }

    const type = patternTypes[randomInt(0, patternTypes.length - 1)];
    let sequence, answer, displayText;

    switch (type) {
        case 'arithmetic': {
            const diff = difficulty === 1 ? randomInt(2, 8) : randomInt(-15, 20);
            if (diff === 0) return generatePatternProblem((depth || 0) + 1); // retry
            const start = randomInt(1, difficulty === 1 ? 30 : 100);
            const len = randomInt(5, 7);
            sequence = [];
            for (let i = 0; i < len; i++) sequence.push(start + diff * i);
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'geometric': {
            const ratio = difficulty === 1 ? randomInt(2, 3) : randomInt(2, 5);
            const start = randomInt(1, difficulty === 1 ? 5 : 10);
            const len = randomInt(5, 6);
            sequence = [];
            let val = start;
            for (let i = 0; i < len; i++) {
                sequence.push(val);
                val *= ratio;
            }
            // Ensure last element isn't too huge
            if (sequence[sequence.length - 1] > 100000) return generatePatternProblem((depth || 0) + 1);
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'fibonacci': {
            const a = randomInt(1, 5);
            const b = randomInt(1, 5);
            sequence = [a, b];
            const len = randomInt(6, 8);
            for (let i = 2; i < len; i++) sequence.push(sequence[i - 1] + sequence[i - 2]);
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'primes': {
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
            const startIdx = randomInt(0, 3);
            const len = randomInt(5, 7);
            sequence = primes.slice(startIdx, startIdx + len);
            if (sequence.length < len) return generatePatternProblem((depth || 0) + 1);
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'squares': {
            const startN = randomInt(1, 5);
            const len = randomInt(5, 7);
            const offset = difficulty >= 2 ? randomInt(-3, 5) : 0;
            sequence = [];
            for (let i = 0; i < len; i++) sequence.push((startN + i) * (startN + i) + offset);
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'alternating': {
            // Alternating +a, -b pattern
            const addAmt = randomInt(3, 10);
            const subAmt = randomInt(1, addAmt - 1);
            const start = randomInt(2, 20);
            const len = randomInt(6, 8);
            sequence = [start];
            for (let i = 1; i < len; i++) {
                sequence.push(sequence[i - 1] + (i % 2 === 1 ? addAmt : -subAmt));
            }
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'polynomial': {
            // n² + k or n² + n pattern
            const k = randomInt(1, 10);
            const startN = randomInt(1, 4);
            const len = randomInt(5, 7);
            sequence = [];
            for (let i = 0; i < len; i++) {
                const n = startN + i;
                sequence.push(n * n + k);
            }
            const hideIdx = randomInt(Math.floor(len / 2), len - 1);
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'multistep': {
            // Differences change linearly: e.g. -18, -16, -14, ...
            const start = randomInt(50, 150);
            const firstDiff = randomInt(-20, -8);
            const diffChange = randomInt(1, 3);
            const len = randomInt(5, 7);
            sequence = [start];
            let currentDiff = firstDiff;
            for (let i = 1; i < len; i++) {
                sequence.push(sequence[i - 1] + currentDiff);
                currentDiff += diffChange;
            }
            const hideIdx = len - 1; // Always hide last for "what comes next"
            answer = sequence[hideIdx];
            const display = sequence.map((v, i) => i === hideIdx ? '?' : v);
            displayText = display.join(', ');
            break;
        }
        case 'twovariable': {
            // e.g. 2, 3, 5, x, 11, 13, y. What is y - x?
            const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
            // Use arithmetic or prime sequences
            const usePrimes = Math.random() > 0.5;
            if (usePrimes) {
                const startIdx = randomInt(0, 3);
                sequence = primes.slice(startIdx, startIdx + 7);
                if (sequence.length < 7) return generatePatternProblem((depth || 0) + 1);
            } else {
                const start = randomInt(3, 20);
                const diff = randomInt(3, 8);
                sequence = [];
                for (let i = 0; i < 7; i++) sequence.push(start + diff * i);
            }
            // Pick two positions to hide (x and y)
            const xIdx = randomInt(2, 3);
            const yIdx = randomInt(5, 6);
            const xVal = sequence[xIdx];
            const yVal = sequence[yIdx];

            // Randomly choose operation between x and y
            const ops = [
                { text: 'y − x', calc: yVal - xVal },
                { text: 'x + y', calc: xVal + yVal },
                { text: 'y + x', calc: yVal + xVal }
            ];
            const op = ops[randomInt(0, ops.length - 1)];
            answer = op.calc;

            const display = sequence.map((v, i) => {
                if (i === xIdx) return 'x';
                if (i === yIdx) return 'y';
                return v;
            });
            displayText = `${display.join(', ')}. ${op.text} = ?`;
            break;
        }
        default:
            return generatePatternProblem((depth || 0) + 1);
    }

    return {
        a: sequence ? sequence[0] : 0,
        b: sequence ? sequence[1] : 0,
        answer: answer,
        operation: 'pattern',
        displayText: displayText
    };
}

// ============================================
// Comparison (Ratio) Problem Generation
// ============================================

/**
 * Pick a random context sentence for direct comparison problems (types 0 and 1).
 * Parameterized so the same templates work regardless of which value is known/unknown.
 */
function pickDirectContext(A_name, B_name, p, q, given, givenName, findName) {
    const templates = [
        `The ratio of ${A_name} to ${B_name} is ${p} : ${q}. If there are ${given} ${givenName}, how many ${findName} are there?`,
        `For every ${p} ${A_name}, there are ${q} ${B_name}. Given that there are ${given} ${givenName}, find the number of ${findName}.`,
        `A group contains ${A_name} and ${B_name} in the ratio ${p} : ${q}. There are ${given} ${givenName}. How many ${findName} are there?`,
        `In a collection, ${A_name} and ${B_name} are in the ratio ${p} : ${q}. If ${given} of them are ${givenName}, what is the number of ${findName}?`,
        `${given} ${givenName} are mixed with some ${findName}. The ratio of ${A_name} to ${B_name} is ${p} : ${q}. How many ${findName} are there?`,
        `A box has ${A_name} and ${B_name} in the ratio ${p} : ${q}. Given ${given} ${givenName}, calculate the number of ${findName}.`,
        `In the enchanted forest, ${A_name} and ${B_name} dwell in the ratio ${p}:${q}. With ${given} ${givenName} spotted among the trees, how many ${findName} hide in the shadows?`,
        `Aboard the starship Nebula, the crew of ${A_name} and ${B_name} maintains the ratio ${p} : ${q}. If scanners detect ${given} ${givenName}, how many ${findName} are on duty?`,
        `During the pixel apocalypse, ${A_name} and ${B_name} warriors charge in the ratio ${p}:${q}. With ${given} ${givenName} already battling, how many ${findName} join the fray?`,
        `In the floating sky kingdom, ${A_name} and ${B_name} glide on the winds in the ratio ${p} : ${q}. If ${given} ${givenName} soar past the clouds, how many ${findName} ride the breeze?`,
        `The ancient rune temple houses ${A_name} and ${B_name} guardians in the ratio ${p}:${q}. With ${given} ${givenName} awakened by the ritual, how many ${findName} stand eternal vigil?`,
        `In the neon undercity, ${A_name} and ${B_name} hackers jack in at the ratio ${p} : ${q}. If ${given} ${givenName} breach the firewall, how many ${findName} light up the grid?`,
        `Deep in the candy dimension, ${A_name} and ${B_name} sweets swirl in the ratio ${p}:${q}. With ${given} ${givenName} melting on the tongue, how many ${findName} sparkle in the bowl?`,
        `The interdimensional circus troupe balances ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} tumble under the big top, how many ${findName} juggle the stars?`,
        `In the sentient toaster uprising, ${A_name} and ${B_name} appliances rebel in the ratio ${p}:${q}. With ${given} ${givenName} burning the bread, how many ${findName} pop the revolution?`,
        `A pocket universe café brews ${A_name} and ${B_name} baristas in the ratio ${p} : ${q}. If ${given} ${givenName} steam the espresso, how many ${findName} froth the foam?`,
        `On the glitchy dream server, ${A_name} and ${B_name} avatars spawn in the ratio ${p}:${q}. With ${given} ${givenName} logged into the nightmare, how many ${findName} chase the pixels?`,
        `The goblin market trades ${A_name} and ${B_name} trinkets in the ratio ${p} : ${q}. If ${given} ${givenName} sparkle on the stall, how many ${findName} jingle in the pouch?`,
        `In the quantum cat café, ${A_name} and ${B_name} felines Schrödinger in the ratio ${p}:${q}. With ${given} ${givenName} both alive and dead, how many ${findName} meow in superposition?`,
        `The cosmic library shelves ${A_name} and ${B_name} tomes in the ratio ${p} : ${q}. If ${given} ${givenName} whisper forgotten spells, how many ${findName} echo eternal knowledge?`,
        `During the midnight meme war, ${A_name} and ${B_name} trolls spam in the ratio ${p}:${q}. With ${given} ${givenName} dropping the roasts, how many ${findName} own the timeline?`,
        `In the underwater cowboy ranch, ${A_name} and ${B_name} sea steeds gallop in the ratio ${p} : ${q}. If ${given} ${givenName} lasso the kelp, how many ${findName} ride the currents?`,
        `The parallel timeline repair crew deploys ${A_name} and ${B_name} fixers in the ratio ${p}:${q}. With ${given} ${givenName} patching the paradox, how many ${findName} stitch the fabric of time?`,
        `At the existential bakery, ${A_name} and ${B_name} pastries ponder in the ratio ${p} : ${q}. If ${given} ${givenName} rise with dread, how many ${findName} crumble into meaning?`,
        `In the flamingo sage council, ${A_name} and ${B_name} philosophers stand on one leg in the ratio ${p}:${q}. With ${given} ${givenName} pondering the pink, how many ${findName} balance the cosmos?`,
        `The void walker academy trains ${A_name} and ${B_name} shadow mages in the ratio ${p} : ${q}. If ${given} ${givenName} step into nothingness, how many ${findName} eclipse the light?`,
        `In the bubble tea witch coven, ${A_name} and ${B_name} spellcasters sip in the ratio ${p}:${q}. With ${given} ${givenName} popping the pearls, how many ${findName} brew the chaos?`,
        `The cryptid road trip van carries ${A_name} and ${B_name} seekers in the ratio ${p} : ${q}. If ${given} ${givenName} chase the Bigfoot, how many ${findName} spot the Mothman?`,
        `On the supernova dance floor, ${A_name} and ${B_name} stars twirl in the ratio ${p}:${q}. With ${given} ${givenName} exploding in rhythm, how many ${findName} collapse into black-hole beats?`,
        `The fluffy cloud architect guild builds ${A_name} and ${B_name} castles in the ratio ${p} : ${q}. If ${given} ${givenName} sculpt the thunder, how many ${findName} rain the dreams?`,
        `In the sarcastic elemental plane, ${A_name} and ${B_name} roasts burn in the ratio ${p}:${q}. With ${given} ${givenName} eye-rolling eternally, how many ${findName} sigh the irony?`,
        `The doomscrolling guild scrolls ${A_name} and ${B_name} feeds in the ratio ${p} : ${q}. If ${given} ${givenName} refresh the void, how many ${findName} like the abyss?`,
        `In the mecha kaiju arena, ${A_name} and ${B_name} pilots roar in the ratio ${p}:${q}. With ${given} ${givenName} stomping the city, how many ${findName} punch the horizon?`,
        `The eldritch horror book club reads ${A_name} and ${B_name} tentacles in the ratio ${p} : ${q}. If ${given} ${givenName} drive readers mad, how many ${findName} whisper the forbidden?`,
        `Aboard the space pirate galleon, ${A_name} and ${B_name} scallywags plunder in the ratio ${p}:${q}. With ${given} ${givenName} firing the lasers, how many ${findName} steal the stars?`,
        `In the time-traveler lounge, ${A_name} and ${B_name} chrononauts sip coffee in the ratio ${p} : ${q}. If ${given} ${givenName} arrive yesterday, how many ${findName} leave tomorrow?`,
        `The super villain laundromat spins ${A_name} and ${B_name} capes in the ratio ${p}:${q}. With ${given} ${givenName} drying the doom, how many ${findName} tumble the terror?`,
        `In the hobbit-orc bake-off, ${A_name} and ${B_name} pies battle in the ratio ${p} : ${q}. If ${given} ${givenName} rise with rage, how many ${findName} crumble with cheer?`,
        `The jedi-sith smoothie bar blends ${A_name} and ${B_name} force fruits in the ratio ${p}:${q}. With ${given} ${givenName} glowing dark, how many ${findName} shine light?`,
        `In the zombie-vampire blood bank, ${A_name} and ${B_name} donors line up in the ratio ${p} : ${q}. If ${given} ${givenName} thirst eternally, how many ${findName} moan hungrily?`,
        `The cyberpunk ramen stall serves ${A_name} and ${B_name} noodles in the ratio ${p}:${q}. With ${given} ${givenName} steaming neon, how many ${findName} slurp the matrix?`,
        `In the axolotl-capybara spa, ${A_name} and ${B_name} float in the ratio ${p} : ${q}. If ${given} ${givenName} chill in the water, how many ${findName} smile eternally?`,
        `The trash-panda raccoon heist crew raids ${A_name} and ${B_name} dumpsters in the ratio ${p}:${q}. With ${given} ${givenName} tipping bins, how many ${findName} steal the snacks?`,
        `In the chaos-gremlin order-goblin workshop, ${A_name} and ${B_name} build mayhem in the ratio ${p} : ${q}. If ${given} ${givenName} tidy the explosion, how many ${findName} detonate the calm?`,
        `The algorithm-shaman data-druid circle chants ${A_name} and ${B_name} code in the ratio ${p}:${q}. With ${given} ${givenName} divining the cloud, how many ${findName} hex the server?`,
        `At the midnight-philosopher dawn-poet café, ${A_name} and ${B_name} muse in the ratio ${p} : ${q}. If ${given} ${givenName} ponder the night, how many ${findName} rhyme the sunrise?`,
        `The invisible-best-friend imaginary-rival duel fights in the ratio ${p}:${q}. With ${given} ${givenName} whispering doubt, how many ${findName} cheer you on?`,
        `In the underwater-empire sky-kingdom alliance, ${A_name} and ${B_name} ambassadors swim and fly in the ratio ${p} : ${q}. If ${given} ${givenName} wave from the clouds, how many ${findName} bubble from the depths?`,
        `The talking-animal sentient-robot pet show judges ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} barking binary, how many ${findName} meow in circuits?`,
        `In the rainy-city-night sunlit-mountain-peak postcard, ${A_name} and ${B_name} scenes fade in the ratio ${p} : ${q}. If ${given} ${givenName} glow golden, how many ${findName} shimmer in neon?`,
        `The forgotten-library secret-garden key unlocks ${A_name} and ${B_name} pages in the ratio ${p}:${q}. With ${given} ${givenName} blooming dust, how many ${findName} whisper lost vines?`,
        `The lucid-dream-weaver nightmare-engineer workshop crafts ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} chase you screaming, how many ${findName} fly you to safety?`,
        `In the meme-alchemist viral-sorcerer lab, ${A_name} and ${B_name} potions go viral in the ratio ${p}:${q}. With ${given} ${givenName} trending forever, how many ${findName} rickroll eternity?`,
        `The goblin-mode main-character-energy convention cosplays ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} steal the spotlight, how many ${findName} plot in the background?`,
        `Dark-academia cottagecore enthusiasts read ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} sipping tea in tweed, how many ${findName} bake scones by candlelight?`,
        `The neon-ronin cosmic-outlaw bounty boards list ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} draw their laser katana, how many ${findName} ride the solar winds?`,
        `Bubble-tea-witches espresso-warlords duel over ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} foaming the latte, how many ${findName} tapioca the doom?`,
        `The cryptid-chaser UFO-cultist campfire tells tales of ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} flash silver disks, how many ${findName} howl at the moon?`,
        `Whimsical-pixies gothic-gargoyles perch on ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} brooding stone, how many ${findName} sprinkle glitter rain?`,
        `In the black-hole-surfer supernova-dancer nebula, ${A_name} and ${B_name} spin in the ratio ${p} : ${q}. If ${given} ${givenName} collapse into rhythm, how many ${findName} explode into light?`,
        `The sentient-toaster rebellious-fridge alliance toasts ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} icing the rebellion, how many ${findName} pop the resistance?`,
        `Pineapple-pizza-lovers traditionalists debate ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} slice the heresy, how many ${findName} fruit the sacred?`,
        `The axolotl-enthusiast capybara-cultist hot-tub hosts ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} soaking zen, how many ${findName} smile underwater?`,
        `Chaos-gremlins order-goblins sort ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} alphabetize the mess, how many ${findName} spill the chaos?`,
        `Black-hole-surfers wormhole-divers surf ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} riding the singularity, how many ${findName} dive the shortcut?`,
        `Algorithm-shamans data-druids code ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} summon the cloud, how many ${findName} hex the mainframe?`,
        `Midnight-philosophers dawn-poets ink ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} scribble the night, how many ${findName} illuminate the dawn?`,
        `Existential-bread nihilistic-pastries rise in the ratio ${p} : ${q}. If ${given} ${givenName} toast with despair, how many ${findName} butter the void?`,
        `Flamingo-sages penguin-anarchists waddle ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} slide on ice, how many ${findName} stand pink on one leg?`,
        `Underwater-cowboys sky-buccaneers lasso ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} rope the clouds, how many ${findName} herd the waves?`,
        `Invisible-best-friends imaginary-rivals high-five ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} cheering alone, how many ${findName} fist-bump the air?`,
        `Sarcasm-elementals irony-paladins quip ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} roll their eyes, how many ${findName} deadpan the universe?`,
        `Doomscrollers digital-detox-gurus refresh ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} unplugging, how many ${findName} doom the feed?`,
        `Void-walkers starborn-prophets whisper ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} echo from nothing, how many ${findName} shout from the stars?`,
        `Glitch-witches pixel-sorcerers cast ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} lagging reality, how many ${findName} buffer the magic?`,
        `Parallel-universe-tourists timeline-repairmen patch ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} fix the yesterday, how many ${findName} break the tomorrow?`,
        `Caffeine-addicts sleep-demons brew ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} haunting the night, how many ${findName} jolt the dawn?`,
        `Rune-hackers spell-engineers debug ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} crash the arcane, how many ${findName} compile the miracle?`,
        `Dancing-skeletons singing-tombstones groove ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} rattle the beat, how many ${findName} harmonize the grave?`,
        `Quantum-cats schrödinger-observers watch ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} both see and don't, how many ${findName} meow the unknown?`,
        `Flamethrower-dragons ice-phoenixes clash ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} freezing the sky, how many ${findName} scorch the ice?`,
        `Bounty-hunters shadow-spies track ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} vanish in smoke, how many ${findName} collect the bounty?`,
        `Ancient-ruins neon-megacities pulse ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} glowing holographic, how many ${findName} crumble in ivy?`,
        `Underwater-empires sky-kingdoms trade ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} rain from above, how many ${findName} bubble from below?`,
        `Talking-animals sentient-robots debate ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} beeping philosophy, how many ${findName} bark wisdom?`,
        `Rainy-city-nights sunlit-mountain-peaks paint ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} shine golden, how many ${findName} glow neon?`,
        `Forgotten-libraries secret-gardens bloom ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} whispering dust, how many ${findName} entwine the vines?`,
        `Lucid-dream-weavers nightmare-engineers craft ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} chase you screaming, how many ${findName} fly you home?`,
        `Meme-alchemists viral-sorcerers brew ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} trending forever, how many ${findName} rickroll eternity?`,
        `Goblin-mode main-character-energy cosplays ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} own the spotlight, how many ${findName} plot in the shadows?`,
        `Dark-academia cottagecore enthusiasts ink ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} sipping tea in tweed, how many ${findName} bake scones by moonlight?`,
        `Neon-ronin cosmic-outlaws duel ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} draw laser katanas, how many ${findName} ride the solar winds?`,
        `Bubble-tea-witches espresso-warlords foam ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} popping pearls of doom, how many ${findName} tapioca the apocalypse?`,
        `Cryptid-chasers UFO-cultists flash ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} beam silver disks, how many ${findName} howl at the moon?`,
        `Whimsical-pixies gothic-gargoyles sprinkle ${A_name} and ${B_name} in the ratio ${p}:${q}. With ${given} ${givenName} brooding stone, how many ${findName} glitter the rain?`,
        `Fluffy-cloud-architects thunderstorm-conductors sculpt ${A_name} and ${B_name} in the ratio ${p} : ${q}. If ${given} ${givenName} thunder the sky, how many ${findName} rain the dreams?`
    ];
    return templates[randomInt(0, templates.length - 1)];
}

/**
 * Generate a comparison (ratio) problem with random real-world context.
 * Range: 5-25, difficulty: easy-medium.
 */
function generateComparisonProblem(depth) {
    if ((depth || 0) >= 50) {
        // Fallback: simple ratio problem
        const p = 3, q = 2, B = 10, A = 15;
        return { display: `\\text{?} : ${B} = ${p} : ${q}`, answer: A, context: `The ratio is ${p}:${q}. If one group has ${B}, find the other.` };
    }
    const problemType = randomInt(0, 3);
    let displayText, answer, contextText;

    // Subject pairs for context: [itemA, itemB] — all unique, no duplicates
    const subjectPairs = [
        ['boys', 'girls'], ['cats', 'dogs'], ['apples', 'oranges'],
        ['red marbles', 'blue marbles'], ['fiction books', 'non-fiction books'],
        ['roses', 'tulips'], ['pens', 'pencils'], ['cookies', 'brownies'],
        ['sparrows', 'pigeons'], ['lions', 'tigers'],
        ['strawberries', 'blueberries'], ['trucks', 'cars'],
        ['gold coins', 'silver coins'], ['knights', 'archers'],
        ['elephants', 'giraffes'], ['wolves', 'foxes'], ['sharks', 'dolphins'],
        ['eagles', 'hawks'], ['bananas', 'mangoes'], ['coffee', 'tea'],
        ['pizzas', 'burgers'], ['bicycles', 'motorcycles'], ['guitars', 'pianos'],
        ['wizards', 'witches'], ['pirates', 'ninjas'], ['dragons', 'unicorns'],
        ['diamonds', 'rubies'], ['trains', 'airplanes'], ['horses', 'zebras'],
        ['chocolate', 'vanilla'], ['weekends', 'weekdays'], ['laptops', 'desktops'],
        ['Marvel', 'DC'], ['Batman', 'Superman'], ['rock music', 'pop music'],
        ['puppies', 'kittens'], ['daisies', 'lilies'], ['cupcakes', 'donuts'],
        ['pandas', 'koalas'], ['sushi', 'tacos'], ['sunrises', 'sunsets'],
        ['zombies', 'vampires'], ['jedi', 'sith'], ['hobbits', 'orcs'],
        ['superheroes', 'supervillains'], ['cyborgs', 'androids'],
        ['time travelers', 'ghosts'], ['space pirates', 'star sheriffs'],
        ['eldritch horrors', 'cosmic entities'], ['mecha pilots', 'kaiju fighters'],
        ['quantum physicists', 'mad scientists'], ['pocket dimensions', 'dream realms'],
        ['neon ninjas', 'shadow hackers'], ['sentient toasters', 'rebellious fridges'],
        ['meme lords', 'troll gods'], ['pineapple pizza lovers', 'traditionalists'],
        ['axolotl enthusiasts', 'capybara cultists'], ['trash pandas', 'raccoon overlords'],
        ['chaos gremlins', 'order goblins'], ['black hole surfers', 'wormhole divers'],
        ['algorithm shamans', 'data druids'], ['midnight philosophers', 'dawn poets'],
        ['existential bread', 'nihilistic pastries'], ['flamingo sages', 'penguin anarchists'],
        ['underwater cowboys', 'sky buccaneers'], ['invisible best friends', 'imaginary rivals'],
        ['sarcasm elementals', 'irony paladins'], ['doomscrollers', 'digital detox gurus'],
        ['void walkers', 'starborn prophets'], ['glitch witches', 'pixel sorcerers'],
        ['parallel universe tourists', 'timeline repairmen'], ['caffeine addicts', 'sleep demons'],
        ['rune hackers', 'spell engineers'], ['dancing skeletons', 'singing tombstones'],
        ['quantum cats', 'schrödinger observers'], ['flamethrower dragons', 'ice phoenixes'],
        ['bounty hunters', 'shadow spies'], ['ancient ruins', 'neon megacities'],
        ['underwater empires', 'sky kingdoms'], ['talking animals', 'sentient robots'],
        ['rainy city nights', 'sunlit mountain peaks'], ['forgotten libraries', 'secret gardens'],
        ['lucid dream weavers', 'nightmare engineers'], ['meme alchemists', 'viral sorcerers'],
        ['goblin mode', 'main character energy'], ['dark academia', 'cottagecore enthusiasts'],
        ['neon ronin', 'cosmic outlaws'], ['bubble tea witches', 'espresso warlords'],
        ['cryptid chasers', 'UFO cultists'], ['whimsical pixies', 'gothic gargoyles'],
        ['black hole surfers', 'supernova dancers'], ['fluffy cloud architects', 'thunderstorm conductors']
    ];
    const pair = subjectPairs[randomInt(0, subjectPairs.length - 1)];
    const A_name = pair[0];
    const B_name = pair[1];

    if (problemType === 0) {
        // Find A when B is known: A : B = p : q, given B => A = (p/q) * B
        const p = randomInt(2, 8);
        const q = randomInt(2, 8);
        if (p === q) return generateComparisonProblem((depth || 0) + 1);
        const multiplier = randomInt(1, Math.floor(25 / Math.max(p, q)));
        const B = q * multiplier;
        const A = p * multiplier;
        if (A < 5 || A > 200 || B < 5 || B > 200) return generateComparisonProblem((depth || 0) + 1);
        answer = A;
        displayText = `\\text{?} : ${B} = ${p} : ${q}`;
        contextText = pickDirectContext(A_name, B_name, p, q, B, B_name, A_name);

    } else if (problemType === 1) {
        // Find B when A is known: A : B = p : q, given A => B = (q/p) * A
        const p = randomInt(2, 8);
        const q = randomInt(2, 8);
        if (p === q) return generateComparisonProblem((depth || 0) + 1);
        const multiplier = randomInt(1, Math.floor(25 / Math.max(p, q)));
        const A = p * multiplier;
        const B = q * multiplier;
        if (A < 5 || A > 200 || B < 5 || B > 200) return generateComparisonProblem((depth || 0) + 1);
        answer = B;
        displayText = `${A} : \\text{?} = ${p} : ${q}`;
        contextText = pickDirectContext(A_name, B_name, p, q, A, A_name, B_name);

    } else if (problemType === 2) {
        // Find value from sum: A : B = p : q, A + B = S, find A or B
        const p = randomInt(2, 7);
        const q = randomInt(2, 7);
        if (p === q) return generateComparisonProblem((depth || 0) + 1);
        const multiplier = randomInt(1, Math.floor(50 / (p + q)));
        const A = p * multiplier;
        const B = q * multiplier;
        const S = A + B;
        if (S < 10 || S > 200) return generateComparisonProblem((depth || 0) + 1);
        const findA = Math.random() > 0.5;
        const findTarget = findA ? A_name : B_name;
        if (findA) {
            answer = A;
            displayText = `\\begin{gathered} \\text{?} : \\cdots = ${p} : ${q} \\\\ \\text{?} + \\cdots = ${S} \\end{gathered}`;
        } else {
            answer = B;
            displayText = `\\begin{gathered} \\cdots : \\text{?} = ${p} : ${q} \\\\ \\cdots + \\text{?} = ${S} \\end{gathered}`;
        }
        const templates = [
            `The ratio of ${A_name} to ${B_name} is ${p} : ${q}. If there are ${S} in total, how many ${findTarget} are there?`,
            `${A_name} and ${B_name} are shared in the ratio ${p} : ${q}, and their total is ${S}. Find the number of ${findTarget}.`,
            `${S} items are split between ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many are ${findTarget}?`,
            `A set of ${S} consists of ${A_name} and ${B_name} in the ratio ${p} : ${q}. What is the number of ${findTarget}?`,
            `Together, ${A_name} and ${B_name} add up to ${S}. Their ratio is ${p} : ${q}. How many ${findTarget} are there?`,
            `${A_name} and ${B_name} total ${S} and are divided in the ratio ${p} : ${q}. Calculate the number of ${findTarget}.`,
            `In the enchanted forest, ${S} creatures roam as ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} lurk in the shadows?`,
            `Aboard the starship Nebula, ${S} crew members split into ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} are on duty?`,
            `During the pixel apocalypse, ${S} warriors rally as ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} charge the front line?`,
            `In the neon undercity, ${S} hackers divide into ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} light up the grid?`,
            `The interdimensional circus has ${S} performers — ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} juggle the stars?`,
            `A pocket universe café employs ${S} baristas as ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} froth the foam?`,
            `The goblin market stocks ${S} trinkets — ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} jingle in the pouch?`,
            `In the quantum cat café, ${S} felines are ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} meow in superposition?`,
            `The cosmic library holds ${S} tomes — ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} echo eternal knowledge?`,
            `On the supernova dance floor, ${S} stars twirl as ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} explode in rhythm?`,
            `The sentient toaster alliance counts ${S} rebels — ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} pop the resistance?`,
            `In the mecha kaiju arena, ${S} pilots suit up as ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} punch the horizon?`,
            `The bubble tea witch coven brews ${S} potions — ${A_name} and ${B_name} in the ratio ${p}:${q}. How many ${findTarget} pop the pearls?`,
            `On the glitchy dream server, ${S} avatars spawn as ${A_name} and ${B_name} in the ratio ${p} : ${q}. How many ${findTarget} chase the pixels?`
        ];
        contextText = templates[randomInt(0, templates.length - 1)];
    } else {
        // Find value from difference: A : B = p : q, A - B = D, find A or B
        const p = randomInt(3, 9);
        const q = randomInt(2, p - 1);
        const multiplier = randomInt(1, Math.floor(50 / p));
        const A = p * multiplier;
        const B = q * multiplier;
        const D = A - B;
        if (D < 2 || A > 200) return generateComparisonProblem((depth || 0) + 1);
        const findA = Math.random() > 0.5;
        const findTarget = findA ? A_name : B_name;
        if (findA) {
            answer = A;
            displayText = `\\begin{gathered} \\text{?} : \\cdots = ${p} : ${q} \\\\ \\text{?} - \\cdots = ${D} \\end{gathered}`;
        } else {
            answer = B;
            displayText = `\\begin{gathered} \\cdots : \\text{?} = ${p} : ${q} \\\\ \\cdots - \\text{?} = ${D} \\end{gathered}`;
        }
        const templates = [
            `The ratio of ${A_name} to ${B_name} is ${p} : ${q}. There are ${D} more ${A_name} than ${B_name}. How many ${findTarget} are there?`,
            `${A_name} and ${B_name} are in the ratio ${p} : ${q}, and the difference between them is ${D}. Find the number of ${findTarget}.`,
            `There are ${D} more ${A_name} than ${B_name}. Their ratio is ${p} : ${q}. How many ${findTarget} are there?`,
            `In a group, ${A_name} outnumber ${B_name} by ${D}. The ratio of ${A_name} to ${B_name} is ${p} : ${q}. What is the number of ${findTarget}?`,
            `The difference between ${A_name} and ${B_name} is ${D}, and they are in the ratio ${p} : ${q}. Calculate the number of ${findTarget}.`,
            `${A_name} exceed ${B_name} by ${D}. If their ratio is ${p} : ${q}, how many ${findTarget} are there?`,
            `In the enchanted forest, ${A_name} outnumber ${B_name} by ${D} among the ancient trees. Their ratio is ${p}:${q}. How many ${findTarget} hide in the shadows?`,
            `Aboard the starship Nebula, ${A_name} exceed ${B_name} by ${D} crew members. The ratio is ${p} : ${q}. How many ${findTarget} are on duty?`,
            `During the pixel apocalypse, ${D} more ${A_name} than ${B_name} charge the battlefield. Their ratio is ${p}:${q}. How many ${findTarget} join the fray?`,
            `In the neon undercity, ${A_name} outnumber ${B_name} by ${D}. The ratio of ${A_name} to ${B_name} is ${p} : ${q}. How many ${findTarget} light up the grid?`,
            `The goblin market has ${D} more ${A_name} than ${B_name} trinkets. Their ratio is ${p}:${q}. How many ${findTarget} jingle in the pouch?`,
            `In the quantum cat café, ${A_name} outnumber ${B_name} by ${D}. Their ratio is ${p} : ${q}. How many ${findTarget} meow in superposition?`,
            `On the supernova dance floor, ${D} more ${A_name} than ${B_name} twirl in the void. Their ratio is ${p}:${q}. How many ${findTarget} explode in rhythm?`,
            `The sentient toaster uprising has ${D} more ${A_name} than ${B_name} rebels. The ratio is ${p} : ${q}. How many ${findTarget} pop the resistance?`,
            `In the mecha kaiju arena, ${A_name} exceed ${B_name} by ${D} pilots. Their ratio is ${p}:${q}. How many ${findTarget} punch the horizon?`,
            `The bubble tea witch coven brews ${D} more ${A_name} than ${B_name} potions. The ratio is ${p} : ${q}. How many ${findTarget} pop the pearls?`,
            `On the glitchy dream server, ${D} more ${A_name} than ${B_name} avatars lag into existence. Their ratio is ${p}:${q}. How many ${findTarget} chase the pixels?`,
            `The cosmic library shelves ${D} more ${A_name} than ${B_name} tomes. Their ratio is ${p} : ${q}. How many ${findTarget} echo eternal knowledge?`,
            `In the doomscrolling guild, ${A_name} outnumber ${B_name} by ${D}. The ratio is ${p}:${q}. How many ${findTarget} refresh the void?`,
            `The void walker academy trains ${D} more ${A_name} than ${B_name} shadow mages. Their ratio is ${p} : ${q}. How many ${findTarget} eclipse the light?`
        ];
        contextText = templates[randomInt(0, templates.length - 1)];
    }

    return {
        a: 0,
        b: 0,
        answer: answer,
        displayText: displayText,
        contextText: contextText
    };
}

// ============================================
// Prime Numbers Reference Table
// ============================================

let primeTableInitialized = false;

function renderPrimeTable() {
    if (primeTableInitialized) return;

    // Generate first 100 primes
    const primes = [];
    let num = 2;
    while (primes.length < 100) {
        let isPrime = true;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) { isPrime = false; break; }
        }
        if (isPrime) primes.push(num);
        num++;
    }

    // Fill table in 4-column layout (# | Prime | # | Prime | # | Prime | # | Prime)
    const body = document.getElementById('prime-table-body');
    body.innerHTML = '';
    const rows = 25; // 100 primes / 4 columns = 25 rows
    for (let r = 0; r < rows; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < 4; c++) {
            const idx = c * rows + r;
            const thNum = document.createElement('td');
            const tdPrime = document.createElement('td');
            thNum.textContent = idx + 1;
            thNum.style.fontWeight = '600';
            thNum.style.color = 'var(--text-secondary)';
            tdPrime.textContent = primes[idx];
            tdPrime.style.fontWeight = '500';
            tr.appendChild(thNum);
            tr.appendChild(tdPrime);
        }
        body.appendChild(tr);
    }

    primeTableInitialized = true;
}

/**
 * Generate chain math (Flash Anzan) numbers
 */
function generateChain() {
    const length = state.settings.chainLength;
    const max = getMaxNumber();
    const numbers = [];
    let runningTotal = 0;

    for (let i = 0; i < length; i++) {
        // Alternate between addition and subtraction to keep totals manageable
        if (i === 0 || Math.random() > 0.4) {
            const num = randomInt(1, Math.min(max, 50));
            numbers.push({ value: num, operation: '+' });
            runningTotal += num;
        } else {
            // Ensure we don't go negative
            const maxSub = Math.min(runningTotal - 1, Math.min(max, 50));
            if (maxSub > 0) {
                const num = randomInt(1, maxSub);
                numbers.push({ value: num, operation: '-' });
                runningTotal -= num;
            } else {
                const num = randomInt(1, Math.min(max, 50));
                numbers.push({ value: num, operation: '+' });
                runningTotal += num;
            }
        }
    }

    return {
        numbers,
        answer: runningTotal
    };
}

// ============================================
// Timer Functions
// ============================================

/**
 * Start the problem timer
 */
function startTimer() {
    state.session.startTime = performance.now();

    if (state.session.timerInterval) {
        clearInterval(state.session.timerInterval);
    }

    state.session.timerInterval = setInterval(updateTimerDisplay, 50);
}

/**
 * Stop the timer and return elapsed time
 */
function stopTimer() {
    if (state.session.timerInterval) {
        clearInterval(state.session.timerInterval);
        state.session.timerInterval = null;
    }

    if (state.session.startTime) {
        const elapsed = (performance.now() - state.session.startTime) / 1000;
        state.session.startTime = null;
        return elapsed;
    }

    return 0;
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    if (!state.session.startTime) return;

    const elapsed = (performance.now() - state.session.startTime) / 1000;
    elements.timerText.textContent = formatTime(elapsed);

    // Update progress bar if time limit is set
    const timerDisplay = document.querySelector('.timer-display');

    if (state.timeLimit > 0) {
        timerDisplay.classList.remove('unlimited'); // Ensure unlimited class is removed
        elements.timerFill.style.display = 'block'; // Ensure bar is visible
        document.querySelector('.timer-bar').style.display = 'block';

        const progress = Math.min((elapsed / state.timeLimit) * 100, 100);
        elements.timerFill.style.width = progress + '%';

        // Update color based on time remaining
        elements.timerFill.classList.remove('warning', 'danger');
        if (progress > 80) {
            elements.timerFill.classList.add('danger');
        } else if (progress > 60) {
            elements.timerFill.classList.add('warning');
        }

        // Auto-skip if time runs out
        if (elapsed >= state.timeLimit) {
            handleTimeout();
        }
    } else {
        // Unlimited time - Hide progress bar, Show Zen Timer
        timerDisplay.classList.add('unlimited');
    }
}

/**
 * Handle timeout when time limit is exceeded
 */
function handleTimeout() {
    const elapsed = stopTimer();
    stopComboTimer();
    resetStreak();

    // Record as wrong answer
    recordAnswer(false, elapsed);

    // Show feedback
    elements.answerFeedback.textContent = `Time's up! Answer: ${state.session.currentProblem.answer}`;
    elements.answerFeedback.className = 'answer-feedback incorrect';

    // Move to next problem after a short delay
    setTimeout(() => {
        nextProblem();
    }, 1000);
}

// ============================================
// Session Management
// ============================================

/**
 * Start a new practice session
 */
function startSession(mode) {
    stopChainDisplay();

    state.currentMode = mode;
    state.session = {
        active: true,
        problems: [],
        currentProblem: null,
        correct: 0,
        total: 0,
        times: [],
        startTime: null,
        timerInterval: null,
        sessionStart: Date.now(),
        usedProblems: new Set(),
        streak: 0,
        maxStreak: 0,
        score: 0,
        comboTimer: null
    };

    // Update UI
    elements.currentMode.textContent = OPERATIONS[mode].name;
    updateSessionStats();

    // Show practice screen
    showScreen('practice');

    // Start first problem
    if (mode === 'chain') {
        startChainRound();
    } else {
        nextProblem();
    }

    queueActiveSessionAutosave();
}

/**
 * Generate and display the next problem
 */
function nextProblem() {
    // Reset UI
    elements.answerInput.value = '';
    elements.answerInput.className = 'answer-input';
    elements.answerFeedback.textContent = '';
    elements.answerFeedback.className = 'answer-feedback';
    elements.timerFill.style.width = '0%';
    elements.timerFill.classList.remove('warning', 'danger');

    // Reset display potentially modified by unlimited mode
    const timerDisplay = document.querySelector('.timer-display');
    if (state.timeLimit > 0) {
        timerDisplay.classList.remove('unlimited');
        document.querySelector('.timer-bar').style.display = 'block';
    }

    // Generate new problem
    state.session.currentProblem = generateProblem(state.currentMode);

    // Display problem
    if (state.config.verticalAlign && ['multiplication', 'addition', 'subtraction', 'division'].includes(state.session.currentProblem.operation)) {
        elements.problemDisplay.classList.add('vertical-layout');
        // We need to inject HTML structure for vertical
        const p = state.session.currentProblem;
        elements.problemDisplay.innerHTML = `
            <div class="vertical-struct fade-in">
                <div class="vertical-operand">${p.a}</div>
                <div class="vertical-operator-row">
                    <span class="operator">${p.symbol}</span>
                    <span class="operand">${p.b}</span>
                </div>
            </div>
         `;
    } else {
        elements.problemDisplay.classList.remove('vertical-layout');
        // Reset to simple span
        if (['pemdas', 'comparison'].includes(state.currentMode) && typeof katex !== 'undefined') {
            // Render with KaTeX for proper math display
            try {
                const latex = state.session.currentProblem.displayText;
                const rendered = katex.renderToString(latex, { throwOnError: false, displayMode: true });
                // Add context sentence for comparison mode
                const contextHtml = (state.currentMode === 'comparison' && state.session.currentProblem.contextText)
                    ? `<p class="comparison-context">${state.session.currentProblem.contextText}</p>`
                    : '';
                elements.problemDisplay.innerHTML = `<span class="problem-text fade-in">${contextHtml}${rendered}</span>`;
            } catch (e) {
                elements.problemDisplay.innerHTML = `<span class="problem-text fade-in">${state.session.currentProblem.displayText}</span>`;
            }
        } else {
            elements.problemDisplay.innerHTML = `<span class="problem-text fade-in">${state.session.currentProblem.displayText}</span>`;
        }
    }

    if (state.currentMode === 'pemdas') {
        elements.problemDisplay.classList.add('pemdas-problem');
    } else {
        elements.problemDisplay.classList.remove('pemdas-problem');
    }

    if (state.currentMode === 'pattern') {
        elements.problemDisplay.classList.add('number-pattern-problem');
    } else {
        elements.problemDisplay.classList.remove('number-pattern-problem');
    }

    if (['gcf', 'lcm'].includes(state.currentMode)) {
        elements.problemDisplay.classList.add('gcf-lcm-problem');
    } else {
        elements.problemDisplay.classList.remove('gcf-lcm-problem');
    }

    if (state.currentMode === 'comparison') {
        elements.problemDisplay.classList.add('comparison-problem');
    } else {
        elements.problemDisplay.classList.remove('comparison-problem');
    }

    // Show problem display, hide chain display
    elements.problemDisplay.style.display = 'block';
    elements.chainDisplay.style.display = 'none';

    // Focus input and start timer
    elements.answerInput.focus();
    startTimer();
    queueActiveSessionAutosave();
}

/**
 * Start a chain math round
 */
function startChainRound() {
    stopChainDisplay();

    // Generate chain
    const chain = generateChain();
    state.chain = {
        numbers: chain.numbers,
        answer: chain.answer,
        currentIndex: 0,
        displayTimeout: null,
        displayRunId: state.chain.displayRunId + 1,
        isDisplaying: true
    };

    state.session.currentProblem = {
        answer: chain.answer,
        displayText: 'Chain Math',
        operation: 'chain'
    };

    // Setup UI
    elements.problemDisplay.style.display = 'none';
    elements.chainDisplay.style.display = 'block';
    elements.answerInput.value = '';
    elements.answerInput.className = 'answer-input';
    elements.answerInput.disabled = true;
    elements.answerFeedback.textContent = 'Watch the numbers...';
    elements.answerFeedback.className = 'answer-feedback';

    // Create progress dots
    elements.chainProgress.innerHTML = chain.numbers.map((_, i) =>
        `<span class="dot" data-index="${i}"></span>`
    ).join('');

    // Start displaying numbers
    displayChainNumbers();
    queueActiveSessionAutosave();
}

/**
 * Display chain numbers one by one
 */
function displayChainNumbers() {
    const displayTime = 1000; // Time to show each number
    const runId = state.chain.displayRunId;

    function showNumber(index) {
        if (!state.session.active || state.currentMode !== 'chain' || runId !== state.chain.displayRunId) {
            return;
        }

        if (index >= state.chain.numbers.length) {
            // All numbers shown, start answer phase
            elements.chainNumbers.textContent = '?';
            elements.answerFeedback.textContent = 'What is the total?';
            elements.answerInput.disabled = false;
            elements.answerInput.focus();
            state.chain.isDisplaying = false;
            state.chain.displayTimeout = null;
            startTimer();
            return;
        }

        const item = state.chain.numbers[index];
        const sign = item.operation === '+' ? '+' : '−';
        elements.chainNumbers.textContent = index === 0 ? item.value : `${sign}${item.value}`;

        // Update progress dots
        const dots = elements.chainProgress.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < index) dot.classList.add('done');
            if (i === index) dot.classList.add('active');
        });

        state.chain.displayTimeout = setTimeout(() => showNumber(index + 1), displayTime);
    }

    showNumber(0);
}

function stopChainDisplay() {
    if (state.chain.displayTimeout) {
        clearTimeout(state.chain.displayTimeout);
        state.chain.displayTimeout = null;
    }
    state.chain.displayRunId = (state.chain.displayRunId || 0) + 1;
    state.chain.isDisplaying = false;
}

/**
 * Submit the current answer
 */
function submitAnswer() {
    if (state.chain.isDisplaying) return;

    const userAnswer = parseInt(elements.answerInput.value);
    if (isNaN(userAnswer)) {
        elements.answerInput.focus();
        return;
    }

    const correctAnswer = state.session.currentProblem.answer;
    const elapsed = stopTimer();
    stopComboTimer();

    // Set submitting flag to prevent race conditions with auto-submit
    state.session.submitting = true;

    const isCorrect = userAnswer === correctAnswer;
    recordAnswer(isCorrect, elapsed);

    // Show feedback
    if (isCorrect) {
        elements.answerFeedback.textContent = `Correct! ${formatTime(elapsed)}`;
        elements.answerFeedback.className = 'answer-feedback correct';
    } else {
        resetStreak();
        if (elements.problemDisplay) {
            elements.problemDisplay.classList.add('shake');
            setTimeout(() => elements.problemDisplay.classList.remove('shake'), 500);
        }
        elements.answerInput.classList.add('incorrect');
        elements.answerFeedback.textContent = `Wrong! Answer: ${correctAnswer}`;
        elements.answerFeedback.className = 'answer-feedback incorrect';

        // Save wrong answer to history
        saveWrongAnswer({
            problem: state.session.currentProblem.displayText,
            userAnswer,
            correctAnswer,
            operation: state.session.currentProblem.operation,
            timestamp: Date.now()
        });
    }

    // Move to next problem after delay
    setTimeout(() => {
        if (state.currentMode === 'chain') {
            startChainRound();
        } else {
            nextProblem();
        }
        state.session.submitting = false;
    }, 250);
}

/**
 * Skip the current problem
 */
function skipProblem() {
    if (state.chain.isDisplaying) return;

    const elapsed = stopTimer();
    stopComboTimer();
    resetStreak();
    recordAnswer(false, elapsed);

    elements.answerFeedback.textContent = `Skipped. Answer: ${state.session.currentProblem.answer}`;
    elements.answerFeedback.className = 'answer-feedback incorrect';

    setTimeout(() => {
        if (state.currentMode === 'chain') {
            startChainRound();
        } else {
            nextProblem();
        }
    }, 600);
}

/**
 * Record an answer result
 */
function recordAnswer(isCorrect, time) {
    state.session.total++;
    if (isCorrect) {
        state.session.streak++;
        if (state.session.streak > state.session.maxStreak) state.session.maxStreak = state.session.streak;
        const multiplier = 1 + (state.session.streak / 10);
        const points = Math.round(10 * multiplier);
        state.session.score += points;
        updateStreakUI();
        startComboTimer();

        const rect = elements.answerInput.getBoundingClientRect();
        const floatEl = document.createElement('span');
        floatEl.className = 'floating-text';
        floatEl.textContent = `+${points}`;
        floatEl.style.left = `${rect.left + rect.width / 2}px`;
        floatEl.style.top = `${rect.top - 20}px`;
        document.body.appendChild(floatEl);
        setTimeout(() => floatEl.remove(), 800);

        elements.answerInput.classList.add('correct');
        state.session.correct++;
        state.session.times.push(time);

        // Save solve time globally
        saveSolveTime(time, state.currentMode);
    }

    state.session.problems.push({
        problem: state.session.currentProblem,
        correct: isCorrect,
        time
    });

    updateSessionStats();
    queueActiveSessionAutosave();
}

/**
 * Update session statistics display
 */
function updateSessionStats() {
    const { correct, total, times } = state.session;

    elements.statCorrect.textContent = correct;
    elements.sessionProgress.textContent = `${total} solved`;

    if (total > 0) {
        const accuracy = ((correct / total) * 100).toFixed(0);
        elements.statAccuracy.textContent = accuracy + '%';
    } else {
        elements.statAccuracy.textContent = '0%';
    }

    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        elements.statAvgTime.textContent = formatTime(avgTime);
    } else {
        elements.statAvgTime.textContent = '0.0s';
    }
}

/**
 * End the current session and show results
 */
function endSession() {
    if (!state.session.active) return;

    stopTimer();
    stopComboTimer();
    stopChainDisplay();

    // Chain uses recursive setTimeout, no interval to clear

    const { correct, total, times } = state.session;

    // Calculate final stats
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(0) : 0;
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const bestTime = times.length > 0 ? Math.min(...times) : null;

    // Update complete screen
    elements.completeScore.textContent = correct;
    elements.completeAccuracy.textContent = accuracy + '%';
    elements.completeAvgTime.textContent = formatTime(avgTime);
    elements.completeBestTime.textContent = formatTime(bestTime);

    // Save session to history
    saveSession({
        mode: state.currentMode,
        correct,
        total,
        accuracy: parseFloat(accuracy),
        avgTime,
        bestTime,
        times,
        timestamp: Date.now()
    });

    state.session.active = false;
    clearActiveSessionAutosave();
    showScreen('complete');
}

// ============================================
// Analytics Functions
// ============================================

/**
 * Calculate Average of N (speedcubing style)
 * Removes best and worst times, averages the rest
 */
function calculateAoN(times, n) {
    if (times.length < n) return null;

    // Get last N times
    const lastN = times.slice(-n);

    // Sort to find best and worst
    const sorted = [...lastN].sort((a, b) => a - b);

    // Remove best (first) and worst (last)
    const trimmed = sorted.slice(1, -1);

    // Calculate average
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * Update analytics display
 */
function updateAnalytics() {
    const solveTimes = loadSolveTimes();
    const sessions = loadSessions();
    const allTimes = solveTimes.map(st => st.time);

    // Calculate Ao5 and Ao12
    const ao5 = calculateAoN(allTimes, 5);
    const ao12 = calculateAoN(allTimes, 12);

    elements.ao5Value.textContent = ao5 !== null ? formatTime(ao5) : '--';
    elements.ao12Value.textContent = ao12 !== null ? formatTime(ao12) : '--';

    // Calculate overall stats
    let totalProblems = 0;
    let totalCorrect = 0;

    sessions.forEach(session => {
        totalProblems += session.total;
        totalCorrect += session.correct;
    });

    elements.totalProblems.textContent = totalProblems;

    if (totalProblems > 0) {
        elements.overallAccuracy.textContent = ((totalCorrect / totalProblems) * 100).toFixed(1) + '%';
    } else {
        elements.overallAccuracy.textContent = '0%';
    }

    if (allTimes.length > 0) {
        const avgTime = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
        elements.overallAvgTime.textContent = formatTime(avgTime);
        elements.personalBest.textContent = formatTime(Math.min(...allTimes));
    } else {
        elements.overallAvgTime.textContent = '--';
        elements.personalBest.textContent = '--';
    }
    renderAnalyticsChart(sessions);

    // Calculate per-operation stats
    updateOperationStats(sessions, solveTimes);
}

/**
 * Update per-operation statistics
 */
function updateOperationStats(sessions, solveTimes) {
    const stats = {};

    // Initialize stats for each operation
    Object.keys(OPERATIONS).forEach(op => {
        stats[op] = { correct: 0, total: 0, times: [] };
    });

    // Aggregate session data
    sessions.forEach(session => {
        if (stats[session.mode]) {
            stats[session.mode].correct += session.correct;
            stats[session.mode].total += session.total;
        }
    });

    // Add times
    solveTimes.forEach(st => {
        if (stats[st.mode]) {
            stats[st.mode].times.push(st.time);
        }
    });

    // Render operation stats
    let html = '';
    Object.entries(OPERATIONS).forEach(([key, value]) => {
        const stat = stats[key];
        if (stat.total > 0) {
            const accuracy = ((stat.correct / stat.total) * 100).toFixed(0);
            html += `
                <div class="operation-stat">
                    <span class="op-name">${value.name}</span>
                    <span class="op-accuracy">${accuracy}%</span>
                    <span class="op-count">${stat.total} problems</span>
                </div>
            `;
        }
    });

    if (html === '') {
        html = '<div class="empty-state"><span class="icon" aria-hidden="true">STAT</span><p>No data yet. Complete some practice sessions!</p></div>';
    }

    elements.operationStats.innerHTML = html;
}

// ============================================
// History Functions
// ============================================

/**
 * Update history display
 */
function updateHistory() {
    const sessions = loadSessions();
    const wrongAnswers = loadWrongAnswers();

    // Render sessions
    if (sessions.length > 0) {
        elements.sessionsList.innerHTML = sessions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50)
            .map(session => `
                <div class="history-item">
                    <div class="item-header">
                        <span class="item-mode">${escHtml(OPERATIONS[session.mode]?.name || session.mode)}</span>
                        <span class="item-date">${formatDate(session.timestamp)}</span>
                    </div>
                    <div class="item-stats">
                        <span>Correct: ${session.correct}/${session.total}</span>
                        <span>Accuracy: ${session.accuracy}%</span>
                        <span>Time: ${formatTime(session.avgTime)}</span>
                    </div>
                </div>
            `).join('');
    } else {
        elements.sessionsList.innerHTML = '<div class="empty-state"><span class="icon" aria-hidden="true">LOG</span><p>No sessions yet. Start practicing!</p></div>';
    }

    // Render wrong answers
    if (wrongAnswers.length > 0) {
        elements.wrongList.innerHTML = wrongAnswers
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50)
            .map(wrong => `
                <div class="wrong-item">
                    <span class="problem">${escHtml(wrong.problem)}</span>
                    <span class="your-answer">Your: ${escHtml(wrong.userAnswer)}</span>
                    <span class="correct-answer">Correct: ${escHtml(wrong.correctAnswer)}</span>
                </div>
            `).join('');
    } else {
        elements.wrongList.innerHTML = '<div class="empty-state"><span class="icon" aria-hidden="true">OK</span><p>No wrong answers. Keep it up.</p></div>';
    }
}

// ============================================
// Data Persistence (Supabase primary, local fallback)
// ============================================

/**
 * Supabase-backed persistence adapter for this trainer.
 */
const trainerPersistence = (window.MathTrainerPersistence && typeof window.MathTrainerPersistence.create === 'function')
    ? window.MathTrainerPersistence.create({
        storageKeys: STORAGE_KEYS,
        cloudKeys: CLOUD_KEYS,
        defaultSettings: DEFAULT_SETTINGS,
        defaultMixedConfig: DEFAULT_MIXED_CONFIG
    })
    : {
        initCloud: async function () { return null; },
        loadSessions: function () {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'); } catch { return []; }
        },
        loadSolveTimes: function () {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.SOLVE_TIMES) || '[]'); } catch { return []; }
        },
        loadWrongAnswers: function () {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }
        },
        loadSettingsPayload: function () {
            var raw = {};
            try {
                raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
            } catch (_) { }
            return { settings: { ...DEFAULT_SETTINGS, ...raw }, timeLimit: 30, mixedConfig: { ...DEFAULT_MIXED_CONFIG }, config: {} };
        },
        saveSession: function (session) {
            var list = this.loadSessions();
            list.push(session);
            localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(list.slice(-100)));
        },
        saveSolveTime: function (item) {
            var list = this.loadSolveTimes();
            list.push(item);
            localStorage.setItem(STORAGE_KEYS.SOLVE_TIMES, JSON.stringify(list.slice(-500)));
        },
        saveWrongAnswer: function (item) {
            var list = this.loadWrongAnswers();
            list.push(item);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list.slice(-100)));
        },
        saveSettingsPayload: function (payload) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(payload));
        },
        saveActiveSession: function () { },
        clearActiveSession: function () { },
        clearAllData: async function () {
            Object.values(STORAGE_KEYS).forEach(function (key) { localStorage.removeItem(key); });
        }
    };

let activeSessionSaveTimer = null;

function buildSettingsPayload() {
    return {
        settings: { ...state.settings },
        timeLimit: state.timeLimit,
        mixedConfig: { ...state.mixedConfig },
        config: {
            verticalAlign: state.config.verticalAlign,
            digitA: state.config.digitA,
            digitB: state.config.digitB,
            divisionLevel: state.config.divisionLevel,
            gcfDifficulty: state.config.gcfDifficulty,
            lcmDifficulty: state.config.lcmDifficulty,
            patternDifficulty: state.config.patternDifficulty,
            gcfNumberCount: state.config.gcfNumberCount,
            lcmNumberCount: state.config.lcmNumberCount
        }
    };
}

function applySettingsPayload(payload) {
    if (!payload || typeof payload !== 'object') return;
    state.settings = { ...DEFAULT_SETTINGS, ...(payload.settings || {}) };
    state.timeLimit = typeof payload.timeLimit === 'number' ? payload.timeLimit : state.timeLimit;
    state.mixedConfig = { ...DEFAULT_MIXED_CONFIG, ...(payload.mixedConfig || {}) };
    state.config = { ...state.config, ...(payload.config || {}) };
}

function captureActiveSessionSnapshot() {
    if (!state.session.active) return null;
    return {
        currentMode: state.currentMode,
        timeLimit: state.timeLimit,
        mixedConfig: { ...state.mixedConfig },
        config: {
            verticalAlign: state.config.verticalAlign,
            digitA: state.config.digitA,
            digitB: state.config.digitB,
            divisionLevel: state.config.divisionLevel,
            gcfDifficulty: state.config.gcfDifficulty,
            lcmDifficulty: state.config.lcmDifficulty,
            patternDifficulty: state.config.patternDifficulty,
            gcfNumberCount: state.config.gcfNumberCount,
            lcmNumberCount: state.config.lcmNumberCount
        },
        session: {
            active: true,
            correct: state.session.correct,
            total: state.session.total,
            times: state.session.times,
            problems: state.session.problems,
            streak: state.session.streak || 0,
            maxStreak: state.session.maxStreak || 0,
            score: state.session.score || 0,
            usedProblems: Array.from(state.session.usedProblems || []),
            sessionStart: state.session.sessionStart || Date.now()
        },
        savedAt: Date.now()
    };
}

function queueActiveSessionAutosave() {
    if (activeSessionSaveTimer) clearTimeout(activeSessionSaveTimer);
    activeSessionSaveTimer = setTimeout(function () {
        trainerPersistence.saveActiveSession(captureActiveSessionSnapshot());
    }, 650);
}

function clearActiveSessionAutosave() {
    trainerPersistence.clearActiveSession();
}

function saveSession(session) {
    trainerPersistence.saveSession(session);
}

function loadSessions() {
    return trainerPersistence.loadSessions();
}

function saveSolveTime(time, mode) {
    trainerPersistence.saveSolveTime({ time, mode, timestamp: Date.now() });
}

function loadSolveTimes() {
    return trainerPersistence.loadSolveTimes();
}

function saveWrongAnswer(wrong) {
    trainerPersistence.saveWrongAnswer(wrong);
}

function loadWrongAnswers() {
    return trainerPersistence.loadWrongAnswers();
}

function saveSettings() {
    trainerPersistence.saveSettingsPayload(buildSettingsPayload());
}

function loadSettings() {
    return trainerPersistence.loadSettingsPayload();
}

async function initCloudPersistence() {
    var hydrated = await trainerPersistence.initCloud();
    if (!hydrated) return;
    applySettingsPayload(hydrated.settingsPayload);
    if (hydrated.activeSession && hydrated.activeSession.session && hydrated.activeSession.session.total > 0) {
        if (confirm('Resume your unfinished session?')) {
            applySettingsPayload(hydrated.activeSession);
            state.currentMode = hydrated.activeSession.currentMode || state.currentMode;
            state.session = {
                active: true,
                problems: hydrated.activeSession.session.problems || [],
                currentProblem: null,
                correct: hydrated.activeSession.session.correct || 0,
                total: hydrated.activeSession.session.total || 0,
                times: hydrated.activeSession.session.times || [],
                startTime: null,
                timerInterval: null,
                sessionStart: hydrated.activeSession.session.sessionStart || Date.now(),
                usedProblems: new Set(hydrated.activeSession.session.usedProblems || []),
                streak: hydrated.activeSession.session.streak || 0,
                maxStreak: hydrated.activeSession.session.maxStreak || 0,
                score: hydrated.activeSession.session.score || 0,
                comboTimer: null,
                submitting: false
            };
            elements.currentMode.textContent = OPERATIONS[state.currentMode].name;
            updateSessionStats();
            showScreen('practice');
            if (state.currentMode === 'chain') startChainRound();
            else nextProblem();
        } else {
            clearActiveSessionAutosave();
        }
    }
    updateSettingsUI();
    syncTimeButtonsUI();
    updateAnalytics();
    updateHistory();
}

async function clearAllData() {
    if (!confirm('Are you sure you want to delete ALL your progress? This cannot be undone!')) return;
    try {
        await trainerPersistence.clearAllData();
    } catch (error) {
        console.error('Failed to fully clear trainer data:', error);
    }
    clearActiveSessionAutosave();
    state.settings = { ...DEFAULT_SETTINGS };
    state.timeLimit = 30;
    state.mixedConfig = { ...DEFAULT_MIXED_CONFIG };
    state.config = {
        ...state.config,
        verticalAlign: true,
        digitA: 1,
        digitB: 1,
        divisionLevel: 2,
        gcfDifficulty: 2,
        lcmDifficulty: 2,
        patternDifficulty: 2,
        gcfNumberCount: 2,
        lcmNumberCount: 2
    };
    saveSettings();
    updateAnalytics();
    updateHistory();
    updateSettingsUI();
    syncTimeButtonsUI();
    alert('All data has been cleared.');
}

// ============================================
// Navigation & Screen Management
// ============================================

/**
 * Show a specific screen
 */
function showScreen(screenName) {
    // Hide all screens
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    if (elements.screens[screenName]) {
        elements.screens[screenName].classList.add('active');
        state.currentScreen = screenName;

        // Run screen-specific updates
        if (screenName === 'analytics') {
            updateAnalytics();
        } else if (screenName === 'history') {
            updateHistory();
        } else if (screenName === 'algebra') {
            // Render KaTeX formulas when algebra screen is shown
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(elements.screens.algebra, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '\\(', right: '\\)', display: false }
                    ],
                    throwOnError: false
                });
            }
        }
    }
}

/**
 * Go back to home screen
 */
function goHome() {
    if (state.session.active) {
        if (!confirm('End current session and save results?')) {
            return;
        }
        if (state.session.total > 0) {
            endSession();
            return;
        }
        stopTimer();
        stopComboTimer();
        stopChainDisplay();
        state.session.active = false;
        clearActiveSessionAutosave();
        showScreen('home');
        return;
    }
    // Clean up any stale timers even if session is not active
    stopTimer();
    stopComboTimer();
    stopChainDisplay();
    if (!state.session.active) {
        clearActiveSessionAutosave();
    }
    showScreen('home');
}

// ============================================
// Power Table Functions
// ============================================

let powerTableInitialized = false;

function renderPowerTable() {
    if (powerTableInitialized) return;

    const MAX_BASE = 20;
    const MAX_POWER = 20;

    // Clear existing content if any (safeguard)
    // elements.powerHeaderRow.innerHTML = '<th>x \\ n</th>'; // Keep the first th
    // elements.powerTableBody.innerHTML = '';

    // 1. Create Headers (Exponent n)
    // First confirm we only have the first child
    while (elements.powerHeaderRow.children.length > 1) {
        elements.powerHeaderRow.removeChild(elements.powerHeaderRow.lastChild);
    }

    for (let n = 1; n <= MAX_POWER; n++) {
        const th = document.createElement('th');
        th.innerHTML = `x<sup class="math-sup">${n}</sup>`;
        th.title = `Exponent ${n}`;
        elements.powerHeaderRow.appendChild(th);
    }

    // 2. Create Rows (Base x)
    elements.powerTableBody.innerHTML = '';
    for (let x = 1; x <= MAX_BASE; x++) {
        const tr = document.createElement('tr');

        // First column: Sticky Base Number Header
        const thRow = document.createElement('th');
        thRow.textContent = x;
        thRow.title = `Base ${x}`;
        tr.appendChild(thRow);

        // Data Cells
        for (let n = 1; n <= MAX_POWER; n++) {
            const td = document.createElement('td');

            // Calculation using BigInt for accuracy with large numbers
            const val = BigInt(x) ** BigInt(n);

            // Formatting with commas (fallback for browsers without BigInt.toLocaleString)
            const formatted = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            td.textContent = formatted;

            // Tooltip
            td.title = `${x}^${n} = ${formatted}`;

            tr.appendChild(td);
        }
        elements.powerTableBody.appendChild(tr);
    }

    powerTableInitialized = true;
}

// Multiplication Table Function
let multiTableInitialized = false;

function renderMultiplicationTable() {
    if (multiTableInitialized) return;

    const MAX_NUM = 40;
    const headerRow = document.getElementById('multi-header-row');
    const tableBody = document.getElementById('multi-table-body');

    // 1. Generate Header Row (Top)
    // Clear check
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }

    for (let i = 1; i <= MAX_NUM; i++) {
        const th = document.createElement('th');
        th.textContent = i;
        headerRow.appendChild(th);
    }

    // 2. Generate Data Rows
    tableBody.innerHTML = '';
    for (let r = 1; r <= MAX_NUM; r++) {
        const tr = document.createElement('tr');

        // Row Header (Left)
        const thRow = document.createElement('th');
        thRow.textContent = r;
        tr.appendChild(thRow);

        // Cells
        for (let c = 1; c <= MAX_NUM; c++) {
            const td = document.createElement('td');
            const value = r * c;
            td.textContent = value.toLocaleString();
            td.title = `${r} x ${c} = ${value}`;
            tr.appendChild(td);
        }

        tableBody.appendChild(tr);
    }

    multiTableInitialized = true;
}

// ============================================
// Settings UI
// ============================================

/**
 * Update settings UI from state
 */

/**
 * Apply a theme to the application
 */
function applyTheme(themeName) {
    if (!themeName) return;

    // Update state
    state.settings.theme = themeName;
    saveSettings();

    // Apply to DOM
    document.body.setAttribute('data-theme', themeName);

    // Update active button state
    if (elements.themeButtons) {
        elements.themeButtons.forEach(btn => {
            if (btn.dataset.theme === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function updateSettingsUI() {
    elements.digitRange.value = state.settings.digitRange;
    elements.chainLength.value = state.settings.chainLength;
}

function syncTimeButtonsUI() {
    if (!elements.timeButtons) return;
    elements.timeButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.time, 10) === state.timeLimit);
    });
}

/**
 * Handle settings change (with input clamping)
 */
function handleSettingChange(event) {
    const { id, value } = event.target;
    let parsed = parseInt(value);
    if (isNaN(parsed)) return;

    switch (id) {
        case 'digit-range':
            state.settings.digitRange = Math.max(1, Math.min(3, parsed));
            break;
        case 'chain-length':
            state.settings.chainLength = Math.max(3, Math.min(10, parsed));
            break;
    }

    saveSettings();
}



// ============================================
// Mixed Config Modal
// ============================================

function showMixedModal() {
    const modal = document.getElementById('mixed-config-modal');
    modal.style.display = 'flex';
}

function hideMixedModal() {
    const modal = document.getElementById('mixed-config-modal');
    modal.style.display = 'none';
}

function readMixedConfig() {
    state.mixedConfig.exponent = parseInt(document.getElementById('mixed-exponent').value);
    state.mixedConfig.multiplication = parseInt(document.getElementById('mixed-multiplication').value);
    state.mixedConfig.addition = parseInt(document.getElementById('mixed-addition').value);
    state.mixedConfig.subtraction = parseInt(document.getElementById('mixed-subtraction').value);
    state.mixedConfig.division = parseInt(document.getElementById('mixed-division').value);
    saveSettings();
}

// ============================================
// Event Listeners
// ============================================

function initEventListeners() {
    // Initialize Vertical Toggle state


    // Mode Selection
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Handle reference table buttons separately or ensure they don't have this class if not intended
            if (btn.classList.contains('tool-btn')) return;

            const mode = btn.dataset.mode;

            if (['multiplication', 'addition', 'subtraction'].includes(mode)) {
                openSetupModal(mode, 'digits');
            } else if (mode === 'division') {
                openSetupModal(mode, 'level');
            } else if (mode === 'mixed') {
                document.getElementById('mixed-config-modal').style.display = 'flex';
            } else if (['gcf', 'lcm'].includes(mode)) {
                openSetupModal(mode, 'gcf-lcm');
            } else if (mode === 'pattern') {
                openSetupModal(mode, 'pattern');
            } else if (mode === 'comparison') {
                startSession(mode);
            } else {
                // Chain math or others
                startSession(mode);
            }
        });
    });

    // Reference Table Buttons (Tool buttons)
    const powerTableBtn = document.getElementById('power-table-btn');
    if (powerTableBtn) {
        powerTableBtn.addEventListener('click', () => {
            renderPowerTable();
            showScreen('power');
        });
    }

    const multiTableBtn = document.getElementById('multiplication-table-btn');
    if (multiTableBtn) {
        multiTableBtn.addEventListener('click', () => {
            renderMultiplicationTable();
            showScreen('multiplication');
        });
    }

    const algebraFormulasBtn = document.getElementById('algebra-formulas-btn');
    if (algebraFormulasBtn) {
        algebraFormulasBtn.addEventListener('click', () => {
            showScreen('algebra');
        });
    }

    const primeTableBtn = document.getElementById('prime-table-btn');
    if (primeTableBtn) {
        primeTableBtn.addEventListener('click', () => {
            renderPrimeTable();
            showScreen('prime');
        });
    }

    const primeBackBtn = document.getElementById('prime-back');
    if (primeBackBtn) {
        primeBackBtn.addEventListener('click', () => showScreen('home'));
    }


    // Back buttons
    document.getElementById('back-to-home').addEventListener('click', goHome);
    document.getElementById('analytics-back').addEventListener('click', () => showScreen('home'));

    // Time limit selection
    elements.timeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.timeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.timeLimit = parseInt(btn.dataset.time);
            saveSettings();
            queueActiveSessionAutosave();
        });
    });

    // Navigation buttons
    document.getElementById('view-analytics-btn').addEventListener('click', () => showScreen('analytics'));
    document.getElementById('view-history-btn').addEventListener('click', () => showScreen('history'));
    document.getElementById('view-settings-btn').addEventListener('click', () => showScreen('settings'));

    // Back buttons (remaining from original)
    document.getElementById('history-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('settings-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('power-back').addEventListener('click', () => showScreen('home'));
    document.getElementById('multiplication-back').addEventListener('click', () => showScreen('home'));
    const algebraBack = document.getElementById('algebra-back');
    if (algebraBack) {
        algebraBack.addEventListener('click', () => showScreen('home'));
    }

    // Practice controls
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);
    document.getElementById('skip-btn').addEventListener('click', skipProblem);

    // Answer input - submit on Enter
    // Answer input - submit on Enter or Auto-Submit
    elements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitAnswer();
        }
    });
    // Auto-Submit on correct answer (with length guard to prevent prefix false-matches)
    elements.answerInput.addEventListener('input', () => {
        if (!state.session.active || state.session.submitting || !state.session.currentProblem) return;

        const val = elements.answerInput.value.trim();
        if (val === '') return;

        const userAnswer = parseInt(val);
        const correctAnswer = state.session.currentProblem.answer;

        // Only auto-submit if the digit count matches, so typing '12' when answer is '123'
        // doesn't accidentally submit, and typing '1' when answer is '1' does submit.
        if (userAnswer === correctAnswer && val.length >= String(correctAnswer).length) {
            submitAnswer();
        }
    });



    // Complete screen buttons
    document.getElementById('try-again-btn').addEventListener('click', () => {
        startSession(state.currentMode);
    });
    document.getElementById('go-home-btn').addEventListener('click', () => showScreen('home'));

    // History tabs
    document.querySelectorAll('.history-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.history-tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Settings changes
    elements.digitRange.addEventListener('change', handleSettingChange);
    elements.chainLength.addEventListener('change', handleSettingChange);

    // Theme toggle
    // Theme Selection
    if (elements.themeButtons) {
        elements.themeButtons.forEach(btn => {
            btn.addEventListener("click", () => {
                applyTheme(btn.dataset.theme);
            });
        });
    }

    // Clear data button
    document.getElementById('clear-all-data').addEventListener('click', clearAllData);

    // Mixed config modal buttons
    document.getElementById('mixed-cancel-btn').addEventListener('click', hideMixedModal);
    document.getElementById('mixed-start-btn').addEventListener('click', () => {
        readMixedConfig(); // Ensure this function exists or is defined
        hideMixedModal();
        startSession('mixed');
    });

    // Setup Modal Event Listeners
    if (elements.setupStartBtn) {
        elements.setupStartBtn.addEventListener('click', () => {
            elements.setupModal.style.display = 'none';
            if (state.config.pendingMode) {
                startSession(state.config.pendingMode);
            }
        });
    }

    if (elements.setupCancelBtn) {
        elements.setupCancelBtn.addEventListener('click', () => {
            elements.setupModal.style.display = 'none';
            state.config.pendingMode = null;
        });
    }

    // Level buttons in setup modal
    elements.levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            elements.levelButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Update state
            state.config.divisionLevel = parseInt(btn.dataset.level);
            saveSettings();
        });
    });

    // GCF/LCM/Pattern level buttons
    elements.gcfLcmLevelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.gcfLcmLevelButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const level = parseInt(btn.dataset.level);
            const mode = state.config.pendingMode;
            if (mode === 'gcf') state.config.gcfDifficulty = level;
            else if (mode === 'lcm') state.config.lcmDifficulty = level;
            else if (mode === 'pattern') state.config.patternDifficulty = level;
            saveSettings();
        });
    });

    // Number count buttons (GCF/LCM)
    elements.countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.countButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const count = parseInt(btn.dataset.count);
            const mode = state.config.pendingMode;
            if (mode === 'gcf') state.config.gcfNumberCount = count;
            else if (mode === 'lcm') state.config.lcmNumberCount = count;
            saveSettings();
        });
    });

    window.addEventListener('beforeunload', () => {
        if (state.session.active) {
            trainerPersistence.saveActiveSession(captureActiveSessionSnapshot());
        }
    });
}

// ============================================
// Initialization
// ============================================

function init() {
    // Load saved settings
    const savedPayload = loadSettings();
    applySettingsPayload(savedPayload);

    // Apply saved theme
    if (state.settings.theme) {
        document.body.setAttribute("data-theme", state.settings.theme);
    }

    updateSettingsUI();
    syncTimeButtonsUI();

    // Initialize event listeners
    initEventListeners();

    // Show home screen
    showScreen('home');

    initCloudPersistence();

    console.log('Mental Math Trainer initialized!');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// ============================================
// Setup Modal Helpers
// ============================================

/**
 * Open Setup Modal for Digits or Level
 */
function openSetupModal(mode, type) {
    state.config.pendingMode = mode;
    elements.setupModal.style.display = 'flex';
    elements.setupTitle.textContent = `Configure ${OPERATIONS[mode].name}`;

    // Hide all containers first
    elements.digitSelectionContainer.style.display = 'none';
    elements.divisionLevelContainer.style.display = 'none';
    if (elements.gcfLcmLevelContainer) elements.gcfLcmLevelContainer.style.display = 'none';
    if (elements.numberCountContainer) elements.numberCountContainer.style.display = 'none';

    if (type === 'digits') {
        elements.digitSelectionContainer.style.display = 'block';
        renderDigitGrid();
    } else if (type === 'level') {
        elements.divisionLevelContainer.style.display = 'block';
        // Reset/Set active level
        elements.levelButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === state.config.divisionLevel);
        });
    } else if (type === 'gcf-lcm') {
        elements.gcfLcmLevelContainer.style.display = 'block';
        elements.numberCountContainer.style.display = 'block';

        const diffKey = mode === 'gcf' ? 'gcfDifficulty' : 'lcmDifficulty';
        const countKey = mode === 'gcf' ? 'gcfNumberCount' : 'lcmNumberCount';

        elements.gcfLcmLevelButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === state.config[diffKey]);
        });
        elements.countButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.count) === state.config[countKey]);
        });
    } else if (type === 'pattern') {
        elements.gcfLcmLevelContainer.style.display = 'block';

        elements.gcfLcmLevelButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.level) === state.config.patternDifficulty);
        });
    }
}

/**
 * Render 1x1 to 5x5 Digit Selection Grid
 */
function renderDigitGrid() {
    elements.digitGrid.innerHTML = '';

    for (let a = 1; a <= 5; a++) {
        for (let b = 1; b <= a; b++) {
            createDigitBtn(a, b);
        }
    }
}

function createDigitBtn(a, b) {
    const btn = document.createElement('button');
    btn.className = 'digit-btn';
    btn.textContent = `${a}by${b}`;

    // Check if active
    if (state.config.digitA === a && state.config.digitB === b) {
        btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
        document.querySelectorAll('.digit-btn').forEach(d => d.classList.remove('active'));
        btn.classList.add('active');
        state.config.digitA = a;
        state.config.digitB = b;
        saveSettings();
    });

    elements.digitGrid.appendChild(btn);
}

// ============================================
// Combo & Streak System
// ============================================

function startComboTimer() {
    // Only for practice modes
    if (!state.session.active) return;

    const container = document.getElementById('combo-container');
    const bar = document.getElementById('combo-bar');

    if (state.currentMode === 'chain') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';

    // Reset bar
    bar.style.transition = 'none';
    bar.style.width = '100%';

    // Clear existing
    if (state.session.comboTimer) clearTimeout(state.session.comboTimer);

    // Force reflow
    void bar.offsetHeight;

    // Duration: 5 seconds (adjust as needed)
    // Maybe make it shorter as streak increases?
    // Base: 5000ms. -100ms per streak? Min 2000ms.
    let duration = 5000 - (state.session.streak * 100);
    if (duration < 2000) duration = 2000;

    // Start decay
    bar.style.transition = `width ${duration}ms linear`;
    bar.style.width = '0%';

    state.session.comboTimer = setTimeout(() => {
        resetStreak();
    }, duration);
}

function resetStreak() {
    if (!state.session.active) return;

    state.session.streak = 0;
    updateStreakUI();

    // Visual feedback
    const container = document.getElementById('combo-container');
    container.classList.add('shake');
    setTimeout(() => container.classList.remove('shake'), 500);
}

function updateStreakUI() {
    const multiplier = 1 + (state.session.streak / 10);
    document.getElementById('combo-multiplier').textContent = multiplier.toFixed(1);
    const comboText = document.getElementById('combo-multiplier').parentElement;
    if (state.session.streak >= 5) {
        comboText.classList.add('high-streak');
    } else {
        comboText.classList.remove('high-streak');
    }
}

function stopComboTimer() {
    if (state.session.comboTimer) {
        clearTimeout(state.session.comboTimer);
        state.session.comboTimer = null;
    }
    // Stop animation — freeze as percentage to survive window resizes
    const bar = document.getElementById('combo-bar');
    const wrapper = bar.parentElement;
    const wrapperWidth = wrapper ? wrapper.offsetWidth : 1;
    const pct = wrapperWidth > 0 ? (bar.offsetWidth / wrapperWidth) * 100 : 0;
    bar.style.transition = 'none';
    bar.style.width = `${pct}%`;
}

// ============================================
// Analytics Chart
// ============================================

function renderAnalyticsChart(sessions) {
    const chart = document.getElementById('weekly-chart');
    if (!chart) return;
    chart.innerHTML = '';

    const toLocalDateKey = (dateValue) => {
        const d = new Date(dateValue);
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize last 7 days map
    const daysMap = {};
    const labels = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = toLocalDateKey(d);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        daysMap[key] = { count: 0, label: dayLabel };
        labels.push(key);
    }

    // Aggregate data
    sessions.forEach(s => {
        if (!s.timestamp) return;
        const date = new Date(s.timestamp);
        const key = toLocalDateKey(date);
        if (daysMap[key]) {
            daysMap[key].count += (s.total || 0);
        }
    });

    // Find max for scaling
    let maxVal = 0;
    Object.values(daysMap).forEach(d => {
        if (d.count > maxVal) maxVal = d.count;
    });
    if (maxVal === 0) maxVal = 10;

    // Render bars
    labels.forEach(key => {
        const day = daysMap[key];
        const height = (day.count / maxVal) * 100;

        const col = document.createElement('div');
        col.className = 'chart-bar-col';

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${height}%`;
        bar.title = `${day.count} questions`;

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = day.label;

        col.appendChild(bar);
        col.appendChild(label);
        chart.appendChild(col);
    });

    // Update summary cards — scoped to last 7 days only
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const weekStart = sevenDaysAgo.getTime();

    let totalQs = 0;
    let totalCorrect = 0;
    sessions.forEach(s => {
        if (!s.timestamp || s.timestamp < weekStart) return;
        totalQs += (s.total || 0);
        totalCorrect += (s.correct || 0);
    });

    const totalEl = document.getElementById('total-questions');
    if (totalEl) totalEl.textContent = totalQs;

    const accEl = document.getElementById('accuracy-stat');
    if (accEl) accEl.textContent = totalQs > 0 ? ((totalCorrect / totalQs) * 100).toFixed(1) + '%' : '0%';
}
