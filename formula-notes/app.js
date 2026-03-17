/**
 * Formula Notes — App
 * Grid → Two-Panel layout with search, favorites, KaTeX rendering.
 * Categories contain LaTeX template placeholders for user to fill in.
 */

(function () {
    'use strict';

    // ================================================================
    // NOTE DATA — Template categories with LaTeX formulas
    // To add your own notes, just follow the pattern below:
    //   { label: "Human-readable name", tex: "LaTeX string" }
    //
    // Each category has: id, icon, title, description, formulas[]
    // ================================================================

    var CATEGORIES = [
        {
            id: 'algebra-basics',
            icon: '',
            title: 'Algebra Basics',
            description: 'Foundational algebraic identities and binomial expansions.',
            formulas: [
                { id: 'alg-01', label: 'Square of Sum', tex: '(a + b)^2 = a^2 + 2ab + b^2' },
                { id: 'alg-02', label: 'Square of Difference', tex: '(a - b)^2 = a^2 - 2ab + b^2' },
                { id: 'alg-03', label: 'Difference of Squares', tex: 'a^2 - b^2 = (a + b)(a - b)' },
                { id: 'alg-04', label: 'Cube of Sum', tex: '(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3' },
                { id: 'alg-05', label: 'Cube of Difference', tex: '(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3' },
                { id: 'alg-06', label: 'Sum of Cubes', tex: 'a^3 + b^3 = (a + b)(a^2 - ab + b^2)' },
                { id: 'alg-07', label: 'Difference of Cubes', tex: 'a^3 - b^3 = (a - b)(a^2 + ab + b^2)' },
                { id: 'alg-08', label: 'Trinomial Square', tex: '(a + b + c)^2 = a^2 + b^2 + c^2 + 2ab + 2bc + 2ca' },
                // ADD MORE HERE:
                // { id: 'alg-09', label: 'Your Label', tex: 'Your LaTeX' },
            ]
        },
        {
            id: 'quadratic',
            icon: '',
            title: 'Quadratic Equations',
            description: 'Quadratic formula, discriminant, and root relationships.',
            formulas: [
                { id: 'qd-01', label: 'Standard Form', tex: 'ax^2 + bx + c = 0' },
                { id: 'qd-02', label: 'Quadratic Formula', tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
                { id: 'qd-03', label: 'Discriminant', tex: 'D = b^2 - 4ac' },
                { id: 'qd-04', label: 'Sum of Roots', tex: 'x_1 + x_2 = -\\frac{b}{a}' },
                { id: 'qd-05', label: 'Product of Roots', tex: 'x_1 \\cdot x_2 = \\frac{c}{a}' },
                { id: 'qd-06', label: 'Vertex Form', tex: 'y = a(x - h)^2 + k' },
                { id: 'qd-07', label: 'Vertex Coordinates', tex: 'h = -\\frac{b}{2a}, \\quad k = f(h)' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'logarithms',
            icon: '',
            title: 'Logarithms & Exponents',
            description: 'Logarithmic laws, change of base, and exponent rules.',
            formulas: [
                { id: 'log-01', label: 'Definition', tex: '\\log_a b = c \\iff a^c = b' },
                { id: 'log-02', label: 'Product Rule', tex: '\\log_a (xy) = \\log_a x + \\log_a y' },
                { id: 'log-03', label: 'Quotient Rule', tex: '\\log_a \\frac{x}{y} = \\log_a x - \\log_a y' },
                { id: 'log-04', label: 'Power Rule', tex: '\\log_a x^n = n \\cdot \\log_a x' },
                { id: 'log-05', label: 'Change of Base', tex: '\\log_a b = \\frac{\\log_c b}{\\log_c a}' },
                { id: 'log-06', label: 'Natural Log', tex: '\\ln x = \\log_e x' },
                { id: 'log-07', label: 'Exponent Product', tex: 'a^m \\cdot a^n = a^{m+n}' },
                { id: 'log-08', label: 'Exponent Quotient', tex: '\\frac{a^m}{a^n} = a^{m-n}' },
                { id: 'log-09', label: 'Power of Power', tex: '(a^m)^n = a^{mn}' },
                { id: 'log-10', label: 'Zero Exponent', tex: 'a^0 = 1 \\quad (a \\neq 0)' },
                { id: 'log-11', label: 'Negative Exponent', tex: 'a^{-n} = \\frac{1}{a^n}' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'sequences',
            icon: '',
            title: 'Sequences & Series',
            description: 'Arithmetic, geometric progressions and summation formulas.',
            formulas: [
                { id: 'seq-01', label: 'AP nth Term', tex: 'a_n = a_1 + (n-1)d' },
                { id: 'seq-02', label: 'AP Sum', tex: 'S_n = \\frac{n}{2}(2a_1 + (n-1)d)' },
                { id: 'seq-03', label: 'AP Sum (alt)', tex: 'S_n = \\frac{n}{2}(a_1 + a_n)' },
                { id: 'seq-04', label: 'GP nth Term', tex: 'a_n = a_1 \\cdot r^{n-1}' },
                { id: 'seq-05', label: 'GP Sum (r≠1)', tex: 'S_n = a_1 \\cdot \\frac{1 - r^n}{1 - r}' },
                { id: 'seq-06', label: 'Infinite GP (|r|<1)', tex: 'S_\\infty = \\frac{a_1}{1 - r}' },
                { id: 'seq-07', label: 'Sum of First n Naturals', tex: '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}' },
                { id: 'seq-08', label: 'Sum of Squares', tex: '\\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}' },
                { id: 'seq-09', label: 'Sum of Cubes', tex: '\\sum_{k=1}^{n} k^3 = \\left(\\frac{n(n+1)}{2}\\right)^2' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'trigonometry',
            icon: '',
            title: 'Trigonometry',
            description: 'Trigonometric identities, addition formulas, and inverse functions.',
            formulas: [
                { id: 'trig-01', label: 'Pythagorean Identity', tex: '\\sin^2\\theta + \\cos^2\\theta = 1' },
                { id: 'trig-02', label: 'Tangent Identity', tex: '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}' },
                { id: 'trig-03', label: 'Sec² Identity', tex: '1 + \\tan^2\\theta = \\sec^2\\theta' },
                { id: 'trig-04', label: 'Csc² Identity', tex: '1 + \\cot^2\\theta = \\csc^2\\theta' },
                { id: 'trig-05', label: 'Sin Addition', tex: '\\sin(A \\pm B) = \\sin A\\cos B \\pm \\cos A\\sin B' },
                { id: 'trig-06', label: 'Cos Addition', tex: '\\cos(A \\pm B) = \\cos A\\cos B \\mp \\sin A\\sin B' },
                { id: 'trig-07', label: 'Tan Addition', tex: '\\tan(A + B) = \\frac{\\tan A + \\tan B}{1 - \\tan A\\tan B}' },
                { id: 'trig-08', label: 'Double Angle Sin', tex: '\\sin 2\\theta = 2\\sin\\theta\\cos\\theta' },
                { id: 'trig-09', label: 'Double Angle Cos', tex: '\\cos 2\\theta = \\cos^2\\theta - \\sin^2\\theta' },
                { id: 'trig-10', label: 'Half Angle Sin', tex: '\\sin\\frac{\\theta}{2} = \\pm\\sqrt{\\frac{1-\\cos\\theta}{2}}' },
                { id: 'trig-11', label: 'Law of Sines', tex: '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}' },
                { id: 'trig-12', label: 'Law of Cosines', tex: 'c^2 = a^2 + b^2 - 2ab\\cos C' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'calculus-derivatives',
            icon: '',
            title: 'Calculus (Derivatives)',
            description: 'Differentiation rules, common derivatives, and applications.',
            formulas: [
                { id: 'der-01', label: 'Limit Definition', tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
                { id: 'der-02', label: 'Power Rule', tex: '\\frac{d}{dx} x^n = nx^{n-1}' },
                { id: 'der-03', label: 'Product Rule', tex: "(fg)' = f'g + fg'" },
                { id: 'der-04', label: 'Quotient Rule', tex: "\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}" },
                { id: 'der-05', label: 'Chain Rule', tex: "\\frac{d}{dx}f(g(x)) = f'(g(x)) \\cdot g'(x)" },
                { id: 'der-06', label: 'Derivative of sin', tex: '\\frac{d}{dx} \\sin x = \\cos x' },
                { id: 'der-07', label: 'Derivative of cos', tex: '\\frac{d}{dx} \\cos x = -\\sin x' },
                { id: 'der-08', label: 'Derivative of eˣ', tex: '\\frac{d}{dx} e^x = e^x' },
                { id: 'der-09', label: 'Derivative of ln', tex: '\\frac{d}{dx} \\ln x = \\frac{1}{x}' },
                { id: 'der-10', label: 'Derivative of tan', tex: '\\frac{d}{dx} \\tan x = \\sec^2 x' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'calculus-integrals',
            icon: '∫',
            title: 'Calculus (Integrals)',
            description: 'Integration rules, common integrals, and techniques.',
            formulas: [
                { id: 'int-01', label: 'Power Rule', tex: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)' },
                { id: 'int-02', label: 'Integral of 1/x', tex: '\\int \\frac{1}{x} \\, dx = \\ln|x| + C' },
                { id: 'int-03', label: 'Integral of eˣ', tex: '\\int e^x \\, dx = e^x + C' },
                { id: 'int-04', label: 'Integral of sin', tex: '\\int \\sin x \\, dx = -\\cos x + C' },
                { id: 'int-05', label: 'Integral of cos', tex: '\\int \\cos x \\, dx = \\sin x + C' },
                { id: 'int-06', label: 'Integration by Parts', tex: '\\int u \\, dv = uv - \\int v \\, du' },
                { id: 'int-07', label: 'Definite Integral', tex: '\\int_a^b f(x) \\, dx = F(b) - F(a)' },
                { id: 'int-08', label: 'Integral of sec²', tex: '\\int \\sec^2 x \\, dx = \\tan x + C' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'probability',
            icon: '',
            title: 'Probability & Statistics',
            description: 'Combinatorics, probability rules, and descriptive statistics.',
            formulas: [
                { id: 'prob-01', label: 'Permutation', tex: 'P(n, r) = \\frac{n!}{(n-r)!}' },
                { id: 'prob-02', label: 'Combination', tex: 'C(n, r) = \\binom{n}{r} = \\frac{n!}{r!(n-r)!}' },
                { id: 'prob-03', label: 'Probability', tex: 'P(A) = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}' },
                { id: 'prob-04', label: 'Addition Rule', tex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
                { id: 'prob-05', label: 'Conditional', tex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
                { id: 'prob-06', label: "Bayes' Theorem", tex: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}' },
                { id: 'prob-07', label: 'Mean', tex: '\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i' },
                { id: 'prob-08', label: 'Variance', tex: '\\sigma^2 = \\frac{1}{n} \\sum_{i=1}^{n} (x_i - \\bar{x})^2' },
                { id: 'prob-09', label: 'Standard Deviation', tex: '\\sigma = \\sqrt{\\sigma^2}' },
                { id: 'prob-10', label: 'Binomial Distribution', tex: 'P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'linear-algebra',
            icon: '',
            title: 'Linear Algebra',
            description: 'Matrices, determinants, and vector operations.',
            formulas: [
                { id: 'la-01', label: '2×2 Determinant', tex: '\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' },
                { id: 'la-02', label: 'Matrix Multiplication', tex: '(AB)_{ij} = \\sum_{k} A_{ik} B_{kj}' },
                { id: 'la-03', label: 'Transpose', tex: '(A^T)_{ij} = A_{ji}' },
                { id: 'la-04', label: 'Inverse (2×2)', tex: 'A^{-1} = \\frac{1}{ad-bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}' },
                { id: 'la-05', label: 'Dot Product', tex: '\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta' },
                { id: 'la-06', label: 'Cross Product Magnitude', tex: '|\\vec{a} \\times \\vec{b}| = |\\vec{a}||\\vec{b}|\\sin\\theta' },
                { id: 'la-07', label: 'Eigenvalue Equation', tex: 'A\\vec{v} = \\lambda\\vec{v}' },
                // ADD MORE HERE:
            ]
        },
        {
            id: 'number-theory',
            icon: '',
            title: 'Number Theory',
            description: 'Divisibility, modular arithmetic, and prime number properties.',
            formulas: [
                { id: 'nt-01', label: 'Division Algorithm', tex: 'a = bq + r, \\quad 0 \\le r < b' },
                { id: 'nt-02', label: 'GCD Property', tex: '\\gcd(a, b) = \\gcd(b, a \\bmod b)' },
                { id: 'nt-03', label: 'LCM-GCD Relation', tex: '\\text{lcm}(a,b) = \\frac{|ab|}{\\gcd(a,b)}' },
                { id: 'nt-04', label: 'Modular Addition', tex: '(a + b) \\bmod n = ((a \\bmod n) + (b \\bmod n)) \\bmod n' },
                { id: 'nt-05', label: 'Modular Multiplication', tex: '(ab) \\bmod n = ((a \\bmod n)(b \\bmod n)) \\bmod n' },
                { id: 'nt-06', label: "Fermat's Little Theorem", tex: 'a^{p-1} \\equiv 1 \\pmod{p} \\quad (p \\text{ prime}, p \\nmid a)' },
                { id: 'nt-07', label: "Euler's Totient", tex: '\\phi(n) = n \\prod_{p|n} \\left(1 - \\frac{1}{p}\\right)' },
                // ADD MORE HERE:
            ]
        }
    ];

    // ================================================================
    // STATE
    // ================================================================

    var FAVORITES_STORAGE_KEY = 'formulaFavorites';
    var FAVORITES_MIGRATION_KEY = 'formula_favorites_localstorage_v1';
    var FAVORITES_SAVE_DEBOUNCE_MS = 260;
    var FORMULA_LOOKUP = buildFormulaLookup();
    var pendingFormulaFocusId = null;
    var pendingReviewItemId = null;

    var favorites = loadFavorites();
    var activeCategory = null;
    var favoritesCloud = {
        client: null,
        userId: null,
        saveTimer: null
    };

    function loadFavorites() {
        try {
            var raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (raw) return new Set(JSON.parse(raw));
        } catch (_) { }
        return new Set();
    }

    function saveFavorites() {
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
        } catch (_) { }
        queueCloudFavoritesSave();
    }

    function toggleFavorite(id) {
        if (favorites.has(id)) {
            favorites.delete(id);
            removeFormulaFromReviewQueue(id);
        } else {
            favorites.add(id);
            seedFormulaToReviewQueue(id);
        }
        saveFavorites();
    }

    function buildFormulaLookup() {
        var lookup = {};
        CATEGORIES.forEach(function (category) {
            (category.formulas || []).forEach(function (formula) {
                lookup[formula.id] = {
                    formulaId: formula.id,
                    label: formula.label,
                    categoryId: category.id,
                    categoryTitle: category.title
                };
            });
        });
        return lookup;
    }

    function toFormulaReviewId(formulaId) {
        if (window.BrainGymReviewQueue && typeof window.BrainGymReviewQueue.formulaId === 'function') {
            return window.BrainGymReviewQueue.formulaId(formulaId);
        }
        return 'formula:' + formulaId;
    }

    function formulaReviewHref(meta) {
        return 'formula-notes/index.html?cat=' + encodeURIComponent(meta.categoryId) +
            '&formula=' + encodeURIComponent(meta.formulaId) +
            '&review=' + encodeURIComponent(toFormulaReviewId(meta.formulaId));
    }

    function seedFormulaToReviewQueue(formulaId) {
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.seed !== 'function') return;
        var meta = FORMULA_LOOKUP[formulaId];
        if (!meta) return;

        window.BrainGymReviewQueue.seed({
            id: toFormulaReviewId(meta.formulaId),
            type: 'formula',
            title: meta.label,
            subtitle: meta.categoryTitle,
            href: formulaReviewHref(meta)
        });
    }

    function removeFormulaFromReviewQueue(formulaId) {
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.remove !== 'function') return;
        window.BrainGymReviewQueue.remove(toFormulaReviewId(formulaId));
    }

    function seedFavoritesToReviewQueue() {
        favorites.forEach(function (formulaId) {
            seedFormulaToReviewQueue(formulaId);
        });
    }

    function queueCloudFavoritesSave() {
        if (!favoritesCloud.client || !favoritesCloud.userId) return;
        if (favoritesCloud.saveTimer) window.clearTimeout(favoritesCloud.saveTimer);
        favoritesCloud.saveTimer = window.setTimeout(function () {
            syncFavoritesToCloud().catch(function (error) {
                console.error('Failed to sync formula favorites:', error);
            });
        }, FAVORITES_SAVE_DEBOUNCE_MS);
    }

    async function hasFavoritesMigrationMark() {
        var response = await favoritesCloud.client
            .from('user_migrations')
            .select('migration_key')
            .eq('user_id', favoritesCloud.userId)
            .eq('migration_key', FAVORITES_MIGRATION_KEY)
            .maybeSingle();

        if (response.error && response.error.code !== 'PGRST116') {
            throw response.error;
        }

        return Boolean(response.data);
    }

    async function setFavoritesMigrationMark() {
        var response = await favoritesCloud.client
            .from('user_migrations')
            .upsert({
                user_id: favoritesCloud.userId,
                migration_key: FAVORITES_MIGRATION_KEY,
                metadata: { source: 'localStorage', at: new Date().toISOString() }
            }, { onConflict: 'user_id,migration_key' });

        if (response.error) throw response.error;
    }

    async function syncFavoritesToCloud() {
        if (!favoritesCloud.client || !favoritesCloud.userId) return;

        var ids = Array.from(favorites);
        var existingResponse = await favoritesCloud.client
            .from('user_formula_favorites')
            .select('formula_id')
            .eq('user_id', favoritesCloud.userId);
        if (existingResponse.error) throw existingResponse.error;

        if (ids.length > 0) {
            var rows = ids.map(function (id) {
                return {
                    user_id: favoritesCloud.userId,
                    formula_id: id
                };
            });

            var insertResponse = await favoritesCloud.client
                .from('user_formula_favorites')
                .upsert(rows, { onConflict: 'user_id,formula_id' });

            if (insertResponse.error) throw insertResponse.error;
        }

        // Re-read current favorites to avoid deleting items added by another device
        // between the initial select and now.
        var currentIds = {};
        Array.from(favorites).forEach(function (id) { currentIds[id] = true; });
        ids.forEach(function (id) { currentIds[id] = true; });

        var staleIds = (existingResponse.data || [])
            .map(function (row) { return row.formula_id; })
            .filter(function (id) { return !currentIds[id]; });

        if (staleIds.length > 0) {
            var staleDeleteResponse = await favoritesCloud.client
                .from('user_formula_favorites')
                .delete()
                .eq('user_id', favoritesCloud.userId)
                .in('formula_id', staleIds);
            if (staleDeleteResponse.error) throw staleDeleteResponse.error;
        }
    }

    async function migrateFavoritesToCloud() {
        var alreadyMigrated = await hasFavoritesMigrationMark();
        if (alreadyMigrated) return;

        if (favorites.size > 0) {
            await syncFavoritesToCloud();
        }
        await setFavoritesMigrationMark();
    }

    async function hydrateFavoritesFromCloud() {
        var response = await favoritesCloud.client
            .from('user_formula_favorites')
            .select('formula_id')
            .order('created_at', { ascending: true });

        if (response.error) throw response.error;

        var remoteSet = new Set((response.data || []).map(function (row) {
            return row.formula_id;
        }));

        if (remoteSet.size === 0) return;

        favorites = new Set(Array.from(favorites).concat(Array.from(remoteSet)));
        saveFavorites();
        rerenderFavoritesUi();
    }

    function rerenderFavoritesUi() {
        if (activeCategory) {
            renderContent(activeCategory);
        }
    }

    async function initFavoritesCloudSync() {
        if (!window.BrainGymAuth || !window.BrainGymAuth.ready) return;

        try {
            var auth = await window.BrainGymAuth.ready;
            if (!auth || !auth.client || !auth.user) return;

            favoritesCloud.client = auth.client;
            favoritesCloud.userId = auth.user.id;

            await migrateFavoritesToCloud();
            await hydrateFavoritesFromCloud();
        } catch (error) {
            console.error('Formula favorites cloud sync failed:', error);
        }
    }

    // ================================================================
    // KaTeX RENDERING HELPER
    // ================================================================

    function renderTeX(el, tex) {
        try {
            katex.render(tex, el, { displayMode: true, throwOnError: false });
        } catch (e) {
            el.textContent = tex;
        }
    }

    function renderTeXInline(el, tex) {
        try {
            katex.render(tex, el, { displayMode: false, throwOnError: false });
        } catch (e) {
            el.textContent = tex;
        }
    }

    function makeBadgeLabel(text) {
        var clean = String(text || '').replace(/[^A-Za-z0-9]+/g, ' ').trim();
        if (!clean) return 'N/A';
        return clean
            .split(/\s+/)
            .slice(0, 2)
            .map(function (part) { return part.charAt(0).toUpperCase(); })
            .join('');
    }

    // ================================================================
    // GRID VIEW
    // ================================================================

    var gridView = document.getElementById('grid-view');
    var expandedView = document.getElementById('expanded-view');
    var categoryGrid = document.getElementById('category-grid');
    var gridSearchInput = document.getElementById('grid-search');

    function renderGrid(filter) {
        categoryGrid.innerHTML = '';
        filter = (filter || '').toLowerCase().trim();

        var matched = CATEGORIES.filter(function (cat) {
            if (!filter) return true;
            if (cat.title.toLowerCase().indexOf(filter) !== -1) return true;
            if (cat.description.toLowerCase().indexOf(filter) !== -1) return true;
            // Search in formula labels
            return cat.formulas.some(function (f) {
                return f.label.toLowerCase().indexOf(filter) !== -1;
            });
        });

        if (matched.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'category-card no-results';
            empty.innerHTML = '<div class="card-top"><span class="card-emoji">NA</span><span class="card-name">No results found</span></div>';
            categoryGrid.appendChild(empty);
            return;
        }

        matched.forEach(function (cat) {
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'category-card';
            card.setAttribute('data-id', cat.id);
            card.setAttribute('aria-label', 'Open ' + cat.title + ' formulas');

            // Top row
            var top = document.createElement('div');
            top.className = 'card-top';
            top.innerHTML = '<span class="card-emoji">' + makeBadgeLabel(cat.title) + '</span>' +
                '<span class="card-name">' + cat.title + '</span>' +
                '<span class="card-count">' + cat.formulas.length + '</span>';

            // Spoiler (show first 2 formulas)
            var spoiler = document.createElement('div');
            spoiler.className = 'card-spoiler';

            var preview = cat.formulas.slice(0, 2);
            preview.forEach(function (f) {
                var sp = document.createElement('div');
                sp.className = 'spoiler-formula';
                renderTeXInline(sp, f.tex);
                spoiler.appendChild(sp);
            });

            if (cat.formulas.length > 2) {
                var more = document.createElement('div');
                more.className = 'spoiler-more';
                more.textContent = '+' + (cat.formulas.length - 2) + ' more';
                spoiler.appendChild(more);
            }

            card.appendChild(top);
            card.appendChild(spoiler);
            categoryGrid.appendChild(card);

            // Click handler
            card.addEventListener('click', function () {
                openCategory(cat.id);
            });
        });
    }

    gridSearchInput.addEventListener('input', function () {
        renderGrid(this.value);
    });

    // ================================================================
    // EXPANDED VIEW
    // ================================================================

    var sidebarList = document.getElementById('sidebar-list');
    var sidebarSearch = document.getElementById('sidebar-search');
    var contentTitle = document.getElementById('content-title');
    var contentDesc = document.getElementById('content-desc');
    var contentIcon = document.getElementById('content-icon');
    var formulaList = document.getElementById('formula-list');
    var backToGrid = document.getElementById('back-to-grid');

    function openCategory(catId) {
        activeCategory = catId;
        gridView.classList.add('hidden');
        expandedView.classList.remove('hidden');
        expandedView.style.animation = 'none';
        void expandedView.offsetHeight; // trigger reflow
        expandedView.style.animation = '';

        renderSidebar();
        renderContent(catId);

        // Record activity
        if (typeof Gamification !== 'undefined') {
            Gamification.updateStreak();
        }
    }

    function readInitialRoute() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var formulaId = params.get('formula');
            var categoryId = params.get('cat');
            var reviewId = params.get('review');

            if (!categoryId && formulaId && FORMULA_LOOKUP[formulaId]) {
                categoryId = FORMULA_LOOKUP[formulaId].categoryId;
            }

            return {
                categoryId: categoryId || null,
                formulaId: formulaId || null,
                reviewId: reviewId || null
            };
        } catch (_) {
            return {
                categoryId: null,
                formulaId: null,
                reviewId: null
            };
        }
    }

    function closeExpanded() {
        expandedView.classList.add('hidden');
        gridView.classList.remove('hidden');
        gridView.style.animation = 'none';
        void gridView.offsetHeight;
        gridView.style.animation = '';
        activeCategory = null;
        sidebarSearch.value = '';
    }

    backToGrid.addEventListener('click', closeExpanded);

    function renderSidebar(filter) {
        sidebarList.innerHTML = '';
        filter = (filter || '').toLowerCase().trim();

        CATEGORIES.forEach(function (cat) {
            if (filter && cat.title.toLowerCase().indexOf(filter) === -1) return;

            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'sidebar-item' + (cat.id === activeCategory ? ' active' : '');
            item.setAttribute('aria-label', 'View ' + cat.title);
            item.innerHTML = '<span class="sb-emoji">' + makeBadgeLabel(cat.title) + '</span>' +
                '<span class="sb-name">' + cat.title + '</span>' +
                '<span class="sb-count">' + cat.formulas.length + '</span>';

            item.addEventListener('click', function () {
                activeCategory = cat.id;
                renderSidebar(sidebarSearch.value);
                renderContent(cat.id);
            });

            sidebarList.appendChild(item);
        });
    }

    sidebarSearch.addEventListener('input', function () {
        renderSidebar(this.value);
    });

    function renderContent(catId) {
        var cat = CATEGORIES.find(function (c) { return c.id === catId; });
        if (!cat) return;

        contentIcon.textContent = makeBadgeLabel(cat.title);
        contentTitle.textContent = cat.title;
        contentDesc.textContent = cat.description;

        formulaList.innerHTML = '';

        cat.formulas.forEach(function (f) {
            var card = document.createElement('div');
            card.className = 'formula-card' + (favorites.has(f.id) ? ' favorited' : '');
            card.setAttribute('data-formula-id', f.id);

            var body = document.createElement('div');
            body.className = 'formula-body';

            var lbl = document.createElement('div');
            lbl.className = 'formula-label';
            lbl.textContent = f.label;

            var texEl = document.createElement('div');
            texEl.className = 'formula-tex';
            renderTeX(texEl, f.tex);

            body.appendChild(lbl);
            body.appendChild(texEl);

            // Favorite button
            var fav = document.createElement('button');
            fav.className = 'fav-btn' + (favorites.has(f.id) ? ' active' : '');
            fav.textContent = favorites.has(f.id) ? 'SAVED' : 'SAVE';
            fav.title = 'Toggle favorite';
            fav.setAttribute('aria-pressed', favorites.has(f.id) ? 'true' : 'false');

            fav.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleFavorite(f.id);
                var isFav = favorites.has(f.id);
                fav.className = 'fav-btn' + (isFav ? ' active' : '');
                fav.textContent = isFav ? 'SAVED' : 'SAVE';
                fav.setAttribute('aria-pressed', isFav ? 'true' : 'false');
                card.className = 'formula-card' + (isFav ? ' favorited' : '');
            });

            card.appendChild(body);
            card.appendChild(fav);
            formulaList.appendChild(card);
        });

        var focusedFormula = false;
        if (pendingFormulaFocusId) {
            var selector = '[data-formula-id="' + pendingFormulaFocusId.replace(/"/g, '\\"') + '"]';
            var targetCard = formulaList.querySelector(selector);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (favorites.has(pendingFormulaFocusId)) {
                    targetCard.classList.add('favorited');
                }
                focusedFormula = true;

                pendingFormulaFocusId = null;
                pendingReviewItemId = null;
            }
        }

        // Scroll to top when no specific card focus is requested.
        var contentPanel = document.getElementById('content-panel');
        if (contentPanel && !focusedFormula) contentPanel.scrollTop = 0;
    }

    // ================================================================
    // INIT
    // ================================================================

    seedFavoritesToReviewQueue();
    renderGrid();
    initFavoritesCloudSync();

    var initialRoute = readInitialRoute();
    if (initialRoute.formulaId) pendingFormulaFocusId = initialRoute.formulaId;
    if (initialRoute.reviewId) pendingReviewItemId = initialRoute.reviewId;
    if (initialRoute.categoryId) openCategory(initialRoute.categoryId);

})();
