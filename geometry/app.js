/* ============================================================
   Geometry Visualizer — app.js
   Bilingual (EN/ID), Three.js 3D, SVG 2D, KaTeX formulas
   ============================================================ */

(function () {
    'use strict';

    // ===== CURRENT LANGUAGE =====
    var MODULE_STATE_KEY = 'geometry-visualizer';
    var initialState = loadModuleState();
    var currentLang = initialState.lang === 'id' ? 'id' : 'en';
    var initial2DKey = initialState.current2DKey || 'rectangle';
    var initial3DKey = initialState.current3DKey || 'cuboid';
    var initialScrollY = Number(initialState.scrollY) || 0;

    function loadModuleState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.load !== 'function') {
            return {};
        }
        return window.BrainGymModuleState.load(MODULE_STATE_KEY, {}) || {};
    }

    function saveModuleState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.save !== 'function') return;
        window.BrainGymModuleState.save(MODULE_STATE_KEY, {
            lang: currentLang,
            current2DKey: current2DKey,
            current3DKey: current3DKey,
            scrollY: Math.max(0, Math.round(window.scrollY || window.pageYOffset || 0))
        });
    }

    // ===== i18n STRINGS =====
    var I18N = {
        en: {
            heroTitle: 'Explore <span class="gradient-text">Geometry</span>',
            heroSub: 'Interactive visualizations and formulas for every shape you need to know.',
            nav2d: '2D Shapes',
            nav3d: '3D Shapes',
            navMisc: 'Formulas',
            section2dTitle: 'Plane Figures',
            section2dSub: 'Perimeters, areas, and properties of common 2D shapes',
            section3dTitle: 'Solid Figures',
            section3dSub: 'Volumes and surface areas of common 3D shapes',
            sectionMiscTitle: 'Miscellaneous Formulas',
            sectionMiscSub: 'Practical math formulas for everyday and advanced problem solving',
        },
        id: {
            heroTitle: 'Jelajahi <span class="gradient-text">Geometri</span>',
            heroSub: 'Visualisasi interaktif dan rumus untuk setiap bentuk yang perlu kamu ketahui.',
            nav2d: 'Bangun 2D',
            nav3d: 'Bangun 3D',
            navMisc: 'Rumus',
            section2dTitle: 'Bangun Datar',
            section2dSub: 'Rumus keliling, luas, dan sifat-sifat bentuk 2D umum',
            section3dTitle: 'Bangun Ruang',
            section3dSub: 'Rumus volume dan luas permukaan bentuk 3D umum',
            sectionMiscTitle: 'Rumus Lain-Lain',
            sectionMiscSub: 'Rumus matematika praktis untuk pemecahan masalah sehari-hari dan lanjutan',
        },
    };

    // ===== 2D SHAPE DATA =====
    var SHAPES_2D = {
        rectangle: {
            name: { en: 'Rectangle', id: 'Persegi Panjang' },
            formulas: {
                en: [
                    { label: 'Perimeter', tex: 'P = 2l + 2w' },
                    { label: 'Area', tex: 'A = l \\cdot w' },
                ],
                id: [
                    { label: 'Keliling', tex: 'P = 2l + 2w' },
                    { label: 'Luas', tex: 'A = l \\cdot w' },
                ],
            },
            svg: drawRectangle,
        },
        square: {
            name: { en: 'Square', id: 'Persegi' },
            formulas: {
                en: [
                    { label: 'Perimeter', tex: 'P = 4s' },
                    { label: 'Area', tex: 'A = s^2' },
                ],
                id: [
                    { label: 'Keliling', tex: 'P = 4s' },
                    { label: 'Luas', tex: 'A = s^2' },
                ],
            },
            svg: drawSquare,
        },
        triangle: {
            name: { en: 'Triangle', id: 'Segitiga' },
            formulas: {
                en: [
                    { label: 'Perimeter', tex: 'P = a + b + c' },
                    { label: 'Area', tex: 'A = \\tfrac{1}{2}\\,b h' },
                    { label: 'Sum of interior angles', tex: 'A + B + C = 180^\\circ' },
                ],
                id: [
                    { label: 'Keliling', tex: 'P = a + b + c' },
                    { label: 'Luas', tex: 'A = \\tfrac{1}{2}\\,b h' },
                    { label: 'Jumlah sudut dalam', tex: 'A + B + C = 180^\\circ' },
                ],
            },
            svg: drawTriangle,
        },
        'right-triangle': {
            name: { en: 'Right Triangle', id: 'Segitiga Siku-Siku' },
            formulas: {
                en: [
                    { label: 'Pythagorean Theorem', tex: 'a^2 + b^2 = c^2' },
                    { label: 'Area', tex: 'A = \\tfrac{1}{2}\\,a b' },
                ],
                id: [
                    { label: 'Teorema Pythagoras', tex: 'a^2 + b^2 = c^2' },
                    { label: 'Luas', tex: 'A = \\tfrac{1}{2}\\,a b' },
                ],
            },
            svg: drawRightTriangle,
        },
        trapezoid: {
            name: { en: 'Trapezoid', id: 'Trapesium' },
            formulas: {
                en: [
                    { label: 'Perimeter', tex: 'P = a + b + c + d' },
                    { label: 'Area', tex: 'A = \\tfrac{1}{2}\\,h\\,(b_1 + b_2)' },
                ],
                id: [
                    { label: 'Keliling', tex: 'P = a + b + c + d' },
                    { label: 'Luas', tex: 'A = \\tfrac{1}{2}\\,h\\,(b_1 + b_2)' },
                ],
            },
            svg: drawTrapezoid,
        },
        parallelogram: {
            name: { en: 'Parallelogram', id: 'Jajar Genjang' },
            formulas: {
                en: [
                    { label: 'Perimeter', tex: 'P = 2a + 2b' },
                    { label: 'Area', tex: 'A = b \\cdot h' },
                ],
                id: [
                    { label: 'Keliling', tex: 'P = 2a + 2b' },
                    { label: 'Luas', tex: 'A = b \\cdot h' },
                ],
            },
            svg: drawParallelogram,
        },
        circle: {
            name: { en: 'Circle', id: 'Lingkaran' },
            formulas: {
                en: [
                    { label: 'Circumference', tex: 'C = 2\\pi r = \\pi d' },
                    { label: 'Area', tex: 'A = \\pi r^2' },
                    { label: 'Standard equation', tex: '(x - h)^2 + (y - k)^2 = r^2' },
                    { label: 'General equation', tex: 'x^2 + y^2 + Dx + Ey + F = 0' },
                    { label: 'Parametric equations', tex: 'x = h + r\\cos\\theta,\\; y = k + r\\sin\\theta' },
                    { label: 'Polar equation', tex: 'r = a' },
                    { label: 'Diameter', tex: 'd = 2r' },
                    { label: 'Arc length', tex: 'L = r\\theta' },
                    { label: 'Sector area', tex: 'A = \\tfrac{1}{2}r^2\\theta' },
                    { label: 'Chord length', tex: 'c = 2r\\sin\\!\\left(\\tfrac{\\theta}{2}\\right)' },
                    { label: 'Tangent-secant theorem', tex: 't^2 = p \\cdot s' },
                ],
                id: [
                    { label: 'Keliling', tex: 'C = 2\\pi r = \\pi d' },
                    { label: 'Luas', tex: 'A = \\pi r^2' },
                    { label: 'Persamaan standar', tex: '(x - h)^2 + (y - k)^2 = r^2' },
                    { label: 'Persamaan umum', tex: 'x^2 + y^2 + Dx + Ey + F = 0' },
                    { label: 'Persamaan parametrik', tex: 'x = h + r\\cos\\theta,\\; y = k + r\\sin\\theta' },
                    { label: 'Persamaan polar', tex: 'r = a' },
                    { label: 'Diameter', tex: 'd = 2r' },
                    { label: 'Panjang busur', tex: 'L = r\\theta' },
                    { label: 'Luas sektor', tex: 'A = \\tfrac{1}{2}r^2\\theta' },
                    { label: 'Panjang tali busur', tex: 'c = 2r\\sin\\!\\left(\\tfrac{\\theta}{2}\\right)' },
                    { label: 'Teorema garis singgung-secant', tex: 't^2 = p \\cdot s' },
                ],
            },
            svg: drawCircle,
        },
    };

    // ===== 3D SHAPE DATA =====
    var SHAPES_3D = {
        cuboid: {
            name: { en: 'Cuboid', id: 'Balok' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = l \\cdot w \\cdot h' },
                    { label: 'Lateral Surface Area', tex: 'S_L = 2(l + b)h' },
                    { label: 'Total Surface Area', tex: 'S_T = 2(lb + bh + hl)' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = l \\cdot w \\cdot h' },
                    { label: 'Luas Permukaan Lateral', tex: 'S_L = 2(l + b)h' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = 2(lb + bh + hl)' },
                ],
            },
            create: createCuboid,
        },
        cube: {
            name: { en: 'Cube', id: 'Kubus' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = s^3' },
                    { label: 'Lateral Surface Area', tex: 'S_L = 4s^2' },
                    { label: 'Total Surface Area', tex: 'S_T = 6s^2' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = s^3' },
                    { label: 'Luas Permukaan Lateral', tex: 'S_L = 4s^2' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = 6s^2' },
                ],
            },
            create: createCube,
        },
        cylinder: {
            name: { en: 'Right Circular Cylinder', id: 'Silinder Lingkaran Tegak' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\pi r^2 h' },
                    { label: 'Curved Surface Area', tex: 'S_C = 2\\pi r h' },
                    { label: 'Total Surface Area', tex: 'S_T = 2\\pi r(h + r)' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\pi r^2 h' },
                    { label: 'Luas Permukaan Melengkung', tex: 'S_C = 2\\pi r h' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = 2\\pi r(h + r)' },
                ],
            },
            create: createCylinder,
        },
        cone: {
            name: { en: 'Right Circular Cone', id: 'Kerucut Lingkaran Tegak' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\tfrac{1}{3}\\pi r^2 h' },
                    { label: 'Curved Surface Area', tex: 'S_C = \\pi r l' },
                    { label: 'Total Surface Area', tex: 'S_T = \\pi r(l + r)' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\tfrac{1}{3}\\pi r^2 h' },
                    { label: 'Luas Permukaan Melengkung', tex: 'S_C = \\pi r l' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = \\pi r(l + r)' },
                ],
            },
            create: createCone,
        },
        'square-pyramid': {
            name: { en: 'Square Pyramid', id: 'Piramida Persegi' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\tfrac{1}{3}\\,s^2 h' },
                    { label: 'Surface Area', tex: 'S = 2sl + s^2' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\tfrac{1}{3}\\,s^2 h' },
                    { label: 'Luas Permukaan', tex: 'S = 2sl + s^2' },
                ],
            },
            create: createSquarePyramid,
        },
        sphere: {
            name: { en: 'Sphere', id: 'Bola' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\tfrac{4}{3}\\pi r^3' },
                    { label: 'Surface Area', tex: 'S = 4\\pi r^2' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\tfrac{4}{3}\\pi r^3' },
                    { label: 'Luas Permukaan', tex: 'S = 4\\pi r^2' },
                ],
            },
            create: createSphere,
        },
        'solid-hemisphere': {
            name: { en: 'Solid Hemisphere', id: 'Belahan Bola Padat' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\tfrac{2}{3}\\pi r^3' },
                    { label: 'Curved Surface Area', tex: 'S_C = 2\\pi r^2' },
                    { label: 'Total Surface Area', tex: 'S_T = 3\\pi r^2' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\tfrac{2}{3}\\pi r^3' },
                    { label: 'Luas Permukaan Melengkung', tex: 'S_C = 2\\pi r^2' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = 3\\pi r^2' },
                ],
            },
            create: createSolidHemisphere,
        },
        'hollow-hemisphere': {
            name: { en: 'Hollow Hemisphere', id: 'Belahan Bola Berongga' },
            formulas: {
                en: [
                    { label: 'Volume', tex: 'V = \\tfrac{2}{3}\\pi r^3' },
                    { label: 'Curved Surface Area', tex: 'S_C = 2\\pi r^2' },
                    { label: 'Total Surface Area', tex: 'S_T = 3\\pi r^2' },
                ],
                id: [
                    { label: 'Volume', tex: 'V = \\tfrac{2}{3}\\pi r^3' },
                    { label: 'Luas Permukaan Melengkung', tex: 'S_C = 2\\pi r^2' },
                    { label: 'Luas Permukaan Total', tex: 'S_T = 3\\pi r^2' },
                ],
            },
            create: createHollowHemisphere,
        },
    };

    // ===== MISC FORMULAS (grouped by category) =====
    var MISC_FORMULAS = {
        en: [
            {
                category: 'General Math & Conversions',
                items: [
                    { icon: '', title: 'Distance', formulas: [{ tex: 'd = r \\cdot t' }], desc: 'rate r, time t' },
                    { icon: '', title: 'Percentage', formulas: [{ tex: 'p = b \\cdot r' }], desc: 'percentage p, base b, rate r' },
                    { icon: '', title: 'Profit Margin', formulas: [{ tex: 'M = \\dfrac{R - C}{R} \\cdot 100' }], desc: 'margin M (%), revenue R, cost C' },
                    { icon: '', title: 'Average (Arithmetic Mean)', formulas: [{ tex: 'A = \\dfrac{S}{N}' }], desc: 'average A, sum of values S, number of values N' },
                    { icon: '', title: 'Coordinate Distance (3D)', formulas: [{ tex: 'd = \\sqrt{\\Delta x^2 + \\Delta y^2 + \\Delta z^2}' }], desc: 'distance d, change in coordinates Δx, Δy, Δz' },
                    { icon: '', title: 'Probability of an Event', formulas: [{ tex: 'P = \\dfrac{E}{T}' }], desc: 'probability P, desired outcomes E, total possible outcomes T' },
                    { icon: '', title: 'Density', formulas: [{ tex: '\\rho = \\dfrac{m}{V}' }], desc: 'density ρ, mass m, volume V' },
                    { icon: '', title: 'Force (Newton\'s Second Law)', formulas: [{ tex: 'F = m \\cdot a' }], desc: 'force F, mass m, acceleration a' },
                    { icon: '', title: 'Simple Interest', formulas: [{ tex: 'I = P \\cdot r \\cdot t' }], desc: 'principal P, rate r, time t' },
                ],
            },
            {
                category: 'Trigonometry',
                items: [
                    { icon: '', title: 'Sine', formulas: [{ tex: '\\sin(\\theta) = \\dfrac{\\text{Opposite}}{\\text{Hypotenuse}}' }], desc: '' },
                    { icon: '', title: 'Cosine', formulas: [{ tex: '\\cos(\\theta) = \\dfrac{\\text{Adjacent}}{\\text{Hypotenuse}}' }], desc: '' },
                    { icon: '', title: 'Tangent', formulas: [{ tex: '\\tan(\\theta) = \\dfrac{\\text{Opposite}}{\\text{Adjacent}}' }], desc: '' },
                    { icon: '', title: 'Law of Sines', formulas: [{ tex: '\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}' }], desc: '' },
                    { icon: '', title: 'Law of Cosines', formulas: [{ tex: 'c^2 = a^2 + b^2 - 2ab\\cos C' }], desc: '' },
                    { icon: '', title: 'Pythagorean Identity', formulas: [{ tex: '\\sin^2\\theta + \\cos^2\\theta = 1' }], desc: '' },
                ],
            },
            {
                category: 'Coordinate Geometry',
                items: [
                    { icon: '', title: 'Distance Between Two Points', formulas: [{ tex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' }], desc: '' },
                    { icon: '⊕', title: 'Midpoint', formulas: [{ tex: 'M = \\left(\\dfrac{x_1+x_2}{2},\\;\\dfrac{y_1+y_2}{2}\\right)' }], desc: '' },
                    { icon: '', title: 'Slope of a Line', formulas: [{ tex: 'm = \\dfrac{y_2 - y_1}{x_2 - x_1}' }], desc: '' },
                ],
            },
            {
                category: 'Statistics & Probability',
                items: [
                    { icon: '', title: 'Arithmetic Mean', formulas: [{ tex: '\\bar{x} = \\dfrac{\\sum x_i}{n}' }], desc: '' },
                    { icon: '', title: 'Population Std Dev', formulas: [{ tex: '\\sigma = \\sqrt{\\dfrac{\\sum (x_i - \\mu)^2}{N}}' }], desc: '' },
                    { icon: '', title: 'Permutations', formulas: [{ tex: 'P(n,r) = \\dfrac{n!}{(n-r)!}' }], desc: 'order matters' },
                    { icon: '', title: 'Combinations', formulas: [{ tex: 'C(n,r) = \\dfrac{n!}{r!(n-r)!}' }], desc: 'order does not matter' },
                    { icon: '', title: 'Probability', formulas: [{ tex: 'P(A) = \\dfrac{\\text{favorable}}{\\text{total}}' }], desc: '' },
                ],
            },
        ],
        id: [
            {
                category: 'Matematika Umum & Konversi',
                items: [
                    { icon: '', title: 'Jarak', formulas: [{ tex: 'd = r \\cdot t' }], desc: 'laju r, waktu t' },
                    { icon: '', title: 'Persentase', formulas: [{ tex: 'p = b \\cdot r' }], desc: 'persentase p, basis b, laju r' },
                    { icon: '', title: 'Margin Keuntungan', formulas: [{ tex: 'M = \\dfrac{R - C}{R} \\cdot 100' }], desc: 'margin M (%), pendapatan R, biaya C' },
                    { icon: '', title: 'Rata-Rata (Rerata Hitung)', formulas: [{ tex: 'A = \\dfrac{S}{N}' }], desc: 'rata-rata A, jumlah nilai S, banyak nilai N' },
                    { icon: '', title: 'Jarak Koordinat (3D)', formulas: [{ tex: 'd = \\sqrt{\\Delta x^2 + \\Delta y^2 + \\Delta z^2}' }], desc: 'jarak d, perubahan koordinat Δx, Δy, Δz' },
                    { icon: '', title: 'Probabilitas Kejadian', formulas: [{ tex: 'P = \\dfrac{E}{T}' }], desc: 'probabilitas P, hasil diinginkan E, total hasil T' },
                    { icon: '', title: 'Massa Jenis', formulas: [{ tex: '\\rho = \\dfrac{m}{V}' }], desc: 'massa jenis ρ, massa m, volume V' },
                    { icon: '', title: 'Gaya (Hukum Newton II)', formulas: [{ tex: 'F = m \\cdot a' }], desc: 'gaya F, massa m, percepatan a' },
                    { icon: '', title: 'Bunga Sederhana', formulas: [{ tex: 'I = P \\cdot r \\cdot t' }], desc: 'pokok P, laju r, waktu t' },
                ],
            },
            {
                category: 'Trigonometri',
                items: [
                    { icon: '', title: 'Rasio Sinus', formulas: [{ tex: '\\sin\\theta = \\dfrac{\\text{sisi depan}}{\\text{hipotenusa}}' }], desc: '' },
                    { icon: '', title: 'Rasio Kosinus', formulas: [{ tex: '\\cos\\theta = \\dfrac{\\text{sisi samping}}{\\text{hipotenusa}}' }], desc: '' },
                    { icon: '', title: 'Rasio Tangen', formulas: [{ tex: '\\tan\\theta = \\dfrac{\\text{sisi depan}}{\\text{sisi samping}}' }], desc: '' },
                    { icon: '', title: 'Hukum Sinus', formulas: [{ tex: '\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}' }], desc: '' },
                    { icon: '', title: 'Hukum Kosinus', formulas: [{ tex: 'c^2 = a^2 + b^2 - 2ab\\cos C' }], desc: '' },
                    { icon: '', title: 'Identitas Pythagoras', formulas: [{ tex: '\\sin^2\\theta + \\cos^2\\theta = 1' }], desc: '' },
                ],
            },
            {
                category: 'Geometri Koordinat',
                items: [
                    { icon: '', title: 'Jarak Antara Dua Titik', formulas: [{ tex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' }], desc: '' },
                    { icon: '⊕', title: 'Titik Tengah', formulas: [{ tex: 'M = \\left(\\dfrac{x_1+x_2}{2},\\;\\dfrac{y_1+y_2}{2}\\right)' }], desc: '' },
                    { icon: '', title: 'Kemiringan Garis', formulas: [{ tex: 'm = \\dfrac{y_2 - y_1}{x_2 - x_1}' }], desc: '' },
                ],
            },
            {
                category: 'Statistik & Probabilitas',
                items: [
                    { icon: '', title: 'Rata-Rata Aritmetika', formulas: [{ tex: '\\bar{x} = \\dfrac{\\sum x_i}{n}' }], desc: '' },
                    { icon: '', title: 'Deviasi Standar Populasi', formulas: [{ tex: '\\sigma = \\sqrt{\\dfrac{\\sum (x_i - \\mu)^2}{N}}' }], desc: '' },
                    { icon: '', title: 'Permutasi', formulas: [{ tex: 'P(n,k) = \\dfrac{n!}{(n-k)!}' }], desc: 'urutan penting' },
                    { icon: '', title: 'Kombinasi', formulas: [{ tex: 'C(n,k) = \\dfrac{n!}{k!(n-k)!}' }], desc: 'urutan tidak penting' },
                    { icon: '', title: 'Probabilitas', formulas: [{ tex: 'P(E) = \\dfrac{\\text{hasil menguntungkan}}{\\text{hasil mungkin}}' }], desc: '' },
                ],
            },
        ],
    };

    // ===== 2D SHAPE BUTTON NAMES =====
    var SHAPE_BTN_NAMES_2D = {
        rectangle: { en: 'Rectangle', id: 'Persegi Panjang' },
        square: { en: 'Square', id: 'Persegi' },
        triangle: { en: 'Triangle', id: 'Segitiga' },
        'right-triangle': { en: 'Right Triangle', id: 'Segitiga Siku-Siku' },
        trapezoid: { en: 'Trapezoid', id: 'Trapesium' },
        parallelogram: { en: 'Parallelogram', id: 'Jajar Genjang' },
        circle: { en: 'Circle', id: 'Lingkaran' },
    };

    var SHAPE_BTN_NAMES_3D = {
        cuboid: { en: 'Cuboid', id: 'Balok' },
        cube: { en: 'Cube', id: 'Kubus' },
        cylinder: { en: 'Cylinder', id: 'Silinder' },
        cone: { en: 'Cone', id: 'Kerucut' },
        'square-pyramid': { en: 'Sq. Pyramid', id: 'Piramida' },
        sphere: { en: 'Sphere', id: 'Bola' },
        'solid-hemisphere': { en: 'Hemisphere', id: 'Belahan Bola' },
        'hollow-hemisphere': { en: 'Hollow Hemi.', id: 'Bola Berongga' },
    };

    // ===== PARTICLES =====
    function createParticles() {
        var container = document.getElementById('particles');
        var colors = ['#a78bfa', '#06b6d4', '#f472b6', '#34d399'];
        for (var i = 0; i < 30; i++) {
            var p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = 8 + Math.random() * 12 + 's';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            container.appendChild(p);
        }
    }

    // ===== THREE.JS SETUP =====
    var scene, camera, renderer, controls, currentMesh;

    function initThree() {
        var canvas = document.getElementById('three-canvas');
        var container = document.getElementById('canvas-3d');

        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(3, 2.5, 4);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = false;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.5;

        // Lighting
        var ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);

        var dir1 = new THREE.DirectionalLight(0xa78bfa, 0.8);
        dir1.position.set(5, 5, 5);
        scene.add(dir1);

        var dir2 = new THREE.DirectionalLight(0x06b6d4, 0.5);
        dir2.position.set(-5, 3, -3);
        scene.add(dir2);

        var point = new THREE.PointLight(0xf472b6, 0.3, 20);
        point.position.set(0, -3, 0);
        scene.add(point);

        // Grid
        var grid = new THREE.GridHelper(8, 16, 0x1a1a3e, 0x1a1a3e);
        grid.position.y = -1.5;
        scene.add(grid);

        resizeRenderer();
        window.addEventListener('resize', resizeRenderer);
        animate();
    }

    function resizeRenderer() {
        var container = document.getElementById('canvas-3d');
        var w = container.clientWidth;
        var h = container.clientHeight;
        if (w > 0 && h > 0) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }

    var animFrameId = null;
    function animate() {
        animFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    // ===== MATERIAL =====
    function shapeMaterial() {
        return new THREE.MeshPhongMaterial({
            color: 0x7c3aed,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            shininess: 60,
            specular: 0x444444,
        });
    }

    function wireframeMaterial() {
        return new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            wireframe: true,
            transparent: true,
            opacity: 0.2,
        });
    }

    function edgeMaterial() {
        return new THREE.LineBasicMaterial({ color: 0xa78bfa });
    }

    function disposeMesh(obj) {
        if (!obj) return;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(function (m) { m.dispose(); });
            else obj.material.dispose();
        }
        if (obj.children) {
            for (var i = obj.children.length - 1; i >= 0; i--) disposeMesh(obj.children[i]);
        }
    }

    function setMesh(mesh) {
        if (currentMesh) {
            scene.remove(currentMesh);
            disposeMesh(currentMesh);
        }
        currentMesh = mesh;
        scene.add(mesh);
    }

    // ===== 3D SHAPE CREATORS =====
    function createCuboid() {
        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(2.4, 1.6, 1.8);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial()));
        return group;
    }

    function createCube() {
        var group = new THREE.Group();
        var geo = new THREE.BoxGeometry(2, 2, 2);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial()));
        return group;
    }

    function createCylinder() {
        var group = new THREE.Group();
        var geo = new THREE.CylinderGeometry(1, 1, 2.2, 48);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial()));
        return group;
    }

    function createCone() {
        var group = new THREE.Group();
        var geo = new THREE.ConeGeometry(1.2, 2.4, 48);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial()));
        return group;
    }

    function createSquarePyramid() {
        var group = new THREE.Group();
        var geo = new THREE.ConeGeometry(1.4, 2.2, 4);
        geo.rotateY(Math.PI / 4);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMaterial()));
        return group;
    }

    function createSphere() {
        var group = new THREE.Group();
        var geo = new THREE.SphereGeometry(1.4, 48, 32);
        group.add(new THREE.Mesh(geo, shapeMaterial()));
        group.add(new THREE.Mesh(geo, wireframeMaterial()));
        return group;
    }

    function createSolidHemisphere() {
        var group = new THREE.Group();
        var hemiGeo = new THREE.SphereGeometry(1.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        group.add(new THREE.Mesh(hemiGeo, shapeMaterial()));
        group.add(new THREE.Mesh(hemiGeo, wireframeMaterial()));
        var diskGeo = new THREE.CircleGeometry(1.4, 48);
        diskGeo.rotateX(Math.PI / 2);
        var diskMat = shapeMaterial();
        diskMat.color.set(0x5b21b6);
        group.add(new THREE.Mesh(diskGeo, diskMat));
        return group;
    }

    function createHollowHemisphere() {
        var group = new THREE.Group();
        var outerGeo = new THREE.SphereGeometry(1.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        var outerMat = shapeMaterial();
        outerMat.opacity = 0.5;
        group.add(new THREE.Mesh(outerGeo, outerMat));
        group.add(new THREE.Mesh(outerGeo, wireframeMaterial()));
        var innerGeo = new THREE.SphereGeometry(1.1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        var innerMat = shapeMaterial();
        innerMat.color.set(0x06b6d4);
        innerMat.opacity = 0.35;
        innerMat.side = THREE.BackSide;
        group.add(new THREE.Mesh(innerGeo, innerMat));
        var ringGeo = new THREE.RingGeometry(1.1, 1.4, 48);
        ringGeo.rotateX(Math.PI / 2);
        var ringMat = shapeMaterial();
        ringMat.color.set(0xa78bfa);
        ringMat.opacity = 0.7;
        group.add(new THREE.Mesh(ringGeo, ringMat));
        return group;
    }

    // ===== 2D SVG DRAWING =====
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(tag, attrs) {
        var el = document.createElementNS(SVG_NS, tag);
        for (var k in attrs) {
            if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
        }
        return el;
    }

    function makeSVG() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 300 300');
        svg.setAttribute('class', 'shape-svg');
        return svg;
    }

    function drawRectangle() {
        var svg = makeSVG();
        var x = 50, y = 80, w = 200, h = 130;
        svg.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, class: 'shape-line' }));
        svg.appendChild(svgEl('line', { x1: x, y1: y - 20, x2: x + w, y2: y - 20, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('line', { x1: x + w + 20, y1: y, x2: x + w + 20, y2: y + h, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('text', { x: x + w / 2, y: y - 26, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'l';
        svg.appendChild(svgEl('text', { x: x + w + 32, y: y + h / 2 + 5, 'text-anchor': 'start', class: 'shape-label' })).textContent = 'w';
        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawSquare() {
        var svg = makeSVG();
        var x = 75, y = 75, s = 150;
        svg.appendChild(svgEl('rect', { x: x, y: y, width: s, height: s, class: 'shape-line' }));
        svg.appendChild(svgEl('text', { x: x + s / 2, y: y - 12, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 's';
        svg.appendChild(svgEl('text', { x: x + s + 14, y: y + s / 2 + 5, 'text-anchor': 'start', class: 'shape-label' })).textContent = 's';
        var m = 15;
        svg.appendChild(svgEl('polyline', {
            points: (x + m) + ',' + y + ' ' + (x + m) + ',' + (y + m) + ' ' + x + ',' + (y + m),
            class: 'shape-angle', fill: 'none'
        }));
        [[x, y], [x + s, y], [x, y + s], [x + s, y + s]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawTriangle() {
        var svg = makeSVG();
        svg.appendChild(svgEl('polygon', { points: '150,50 60,240 240,240', class: 'shape-line' }));
        svg.appendChild(svgEl('line', { x1: 150, y1: 50, x2: 150, y2: 240, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('text', { x: 95, y: 140, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'a';
        svg.appendChild(svgEl('text', { x: 205, y: 140, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'b';
        svg.appendChild(svgEl('text', { x: 150, y: 262, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'c';
        svg.appendChild(svgEl('text', { x: 162, y: 155, 'text-anchor': 'start', class: 'shape-label-accent' })).textContent = 'h';
        [[150, 50], [60, 240], [240, 240]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawRightTriangle() {
        var svg = makeSVG();
        svg.appendChild(svgEl('polygon', { points: '60,230 60,70 240,230', class: 'shape-line' }));
        var m = 18;
        svg.appendChild(svgEl('polyline', {
            points: (60 + m) + ',230 ' + (60 + m) + ',' + (230 - m) + ' 60,' + (230 - m),
            class: 'shape-angle', fill: 'none'
        }));
        svg.appendChild(svgEl('text', { x: 42, y: 155, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'a';
        svg.appendChild(svgEl('text', { x: 155, y: 252, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'b';
        svg.appendChild(svgEl('text', { x: 165, y: 140, 'text-anchor': 'start', class: 'shape-label' })).textContent = 'c';
        [[60, 230], [60, 70], [240, 230]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawTrapezoid() {
        var svg = makeSVG();
        svg.appendChild(svgEl('polygon', { points: '100,80 200,80 260,220 40,220', class: 'shape-line' }));
        svg.appendChild(svgEl('line', { x1: 150, y1: 80, x2: 150, y2: 220, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('text', { x: 150, y: 68, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'b₁';
        svg.appendChild(svgEl('text', { x: 150, y: 248, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'b₂';
        svg.appendChild(svgEl('text', { x: 160, y: 155, 'text-anchor': 'start', class: 'shape-label-accent' })).textContent = 'h';
        svg.appendChild(svgEl('text', { x: 57, y: 145, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'a';
        svg.appendChild(svgEl('text', { x: 242, y: 145, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'c';
        [[100, 80], [200, 80], [260, 220], [40, 220]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawParallelogram() {
        var svg = makeSVG();
        svg.appendChild(svgEl('polygon', { points: '100,80 260,80 200,220 40,220', class: 'shape-line' }));
        svg.appendChild(svgEl('line', { x1: 150, y1: 80, x2: 150, y2: 220, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('text', { x: 180, y: 68, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'b';
        svg.appendChild(svgEl('text', { x: 57, y: 155, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'a';
        svg.appendChild(svgEl('text', { x: 160, y: 158, 'text-anchor': 'start', class: 'shape-label-accent' })).textContent = 'h';
        [[100, 80], [260, 80], [200, 220], [40, 220]].forEach(function (pt) {
            svg.appendChild(svgEl('circle', { cx: pt[0], cy: pt[1], r: 3.5, class: 'shape-dot' }));
        });
        return svg;
    }

    function drawCircle() {
        var svg = makeSVG();
        var cx = 150, cy = 150, r = 100;
        svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, class: 'shape-line' }));
        svg.appendChild(svgEl('line', { x1: cx, y1: cy, x2: cx + r, y2: cy, class: 'shape-line-alt' }));
        svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: 4, class: 'shape-dot' }));
        svg.appendChild(svgEl('text', { x: cx + r / 2, y: cy - 10, 'text-anchor': 'middle', class: 'shape-label' })).textContent = 'r';
        svg.appendChild(svgEl('line', {
            x1: cx - r, y1: cy, x2: cx + r, y2: cy,
            stroke: 'rgba(167,139,250,0.15)', 'stroke-width': '1', 'stroke-dasharray': '4 4'
        }));
        svg.appendChild(svgEl('text', { x: cx, y: cy + r + 22, 'text-anchor': 'middle', class: 'shape-label-accent' })).textContent = 'd = 2r';
        return svg;
    }

    // ===== FORMULA RENDERING =====
    function renderFormulas(container, formulas) {
        container.innerHTML = '';
        formulas.forEach(function (f, i) {
            var card = document.createElement('div');
            card.className = 'formula-card';
            card.style.animationDelay = (i * 0.06) + 's';

            if (f.label) {
                var label = document.createElement('div');
                label.className = 'label';
                label.textContent = f.label;
                card.appendChild(label);
            }

            var texEl = document.createElement('div');
            texEl.className = 'tex';
            try {
                katex.render(f.tex, texEl, { displayMode: true, throwOnError: false });
            } catch (e) {
                texEl.textContent = f.tex;
            }
            card.appendChild(texEl);

            container.appendChild(card);
        });
    }

    // ===== SECTION: 2D =====
    var current2DKey = SHAPES_2D[initial2DKey] ? initial2DKey : 'rectangle';

    function init2D() {
        var selectorEl = document.getElementById('selector-2d');
        var canvasEl = document.getElementById('canvas-2d');
        var formulasEl = document.getElementById('formulas-2d');

        function select(key) {
            var shape = SHAPES_2D[key];
            if (!shape) return;
            current2DKey = key;

            selectorEl.querySelectorAll('.shape-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.shape === key);
            });

            canvasEl.innerHTML = '';
            canvasEl.appendChild(shape.svg());

            var title = document.createElement('div');
            title.className = 'shape-title';
            title.textContent = shape.name[currentLang];
            canvasEl.appendChild(title);

            renderFormulas(formulasEl, shape.formulas[currentLang]);
            saveModuleState();
        }

        selectorEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.shape-btn');
            if (btn) select(btn.dataset.shape);
        });

        select(current2DKey);
    }

    // ===== SECTION: 3D =====
    var current3DKey = SHAPES_3D[initial3DKey] ? initial3DKey : 'cuboid';

    function init3D() {
        var selectorEl = document.getElementById('selector-3d');
        var formulasEl = document.getElementById('formulas-3d');
        var container = document.getElementById('canvas-3d');

        var hint = document.createElement('div');
        hint.className = 'canvas-hint';
        hint.textContent = 'Drag to rotate';
        container.appendChild(hint);

        function select(key) {
            var shape = SHAPES_3D[key];
            if (!shape) return;
            current3DKey = key;

            selectorEl.querySelectorAll('.shape-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.shape === key);
            });

            setMesh(shape.create());

            camera.position.set(3, 2.5, 4);
            controls.target.set(0, 0, 0);
            controls.update();

            var titleEl = container.querySelector('.shape-title');
            if (!titleEl) {
                titleEl = document.createElement('div');
                titleEl.className = 'shape-title';
                container.appendChild(titleEl);
            }
            titleEl.textContent = shape.name[currentLang];

            renderFormulas(formulasEl, shape.formulas[currentLang]);
            saveModuleState();
        }

        selectorEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.shape-btn');
            if (btn) select(btn.dataset.shape);
        });

        select(current3DKey);
    }

    // ===== SECTION: MISC =====
    function initMisc() {
        renderMisc();
    }

    function makeBadgeLabel(text) {
        var clean = String(text || '').replace(/[^A-Za-z0-9]+/g, ' ').trim();
        if (!clean) return 'REF';
        return clean
            .split(/\s+/)
            .slice(0, 2)
            .map(function (part) { return part.charAt(0).toUpperCase(); })
            .join('');
    }

    function renderMisc() {
        var grid = document.getElementById('misc-formulas');
        grid.innerHTML = '';

        var categories = MISC_FORMULAS[currentLang];
        categories.forEach(function (cat) {
            // Category heading
            var heading = document.createElement('div');
            heading.className = 'misc-category-title';
            heading.textContent = cat.category;
            grid.appendChild(heading);

            cat.items.forEach(function (item) {
                var card = document.createElement('div');
                card.className = 'misc-card';

                var icon = document.createElement('div');
                icon.className = 'card-icon';
                icon.textContent = makeBadgeLabel(item.title);
                card.appendChild(icon);

                var title = document.createElement('div');
                title.className = 'card-title';
                title.textContent = item.title;
                card.appendChild(title);

                item.formulas.forEach(function (f) {
                    var fDiv = document.createElement('div');
                    fDiv.className = 'card-formula';
                    try {
                        katex.render(f.tex, fDiv, { displayMode: true, throwOnError: false });
                    } catch (e) {
                        fDiv.textContent = f.tex;
                    }
                    card.appendChild(fDiv);
                });

                if (item.desc) {
                    var desc = document.createElement('div');
                    desc.className = 'card-desc';
                    desc.textContent = item.desc;
                    card.appendChild(desc);
                }

                grid.appendChild(card);
            });
        });
    }

    // ===== NAVIGATION =====
    function initNav() {
        var links = document.querySelectorAll('.nav-link');
        var sections = document.querySelectorAll('.section');
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        links.forEach(function (l) {
                            l.classList.toggle('active', l.dataset.section === entry.target.id);
                        });
                    }
                });
            },
            { rootMargin: '-40% 0px -50% 0px' }
        );
        sections.forEach(function (s) { observer.observe(s); });
    }

    // ===== SCROLL REVEAL =====
    function initReveal() {
        var reveals = document.querySelectorAll('.reveal');
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );
        reveals.forEach(function (el) { revealObserver.observe(el); });

        var scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            window.addEventListener('scroll', function () {
                var scrollY = window.scrollY || window.pageYOffset;
                scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 200);
            }, { passive: true });
        }
    }

    // ===== LANGUAGE TOGGLE =====
    function initLang() {
        var toggleEl = document.getElementById('lang-toggle');
        function applyLanguage(lang) {
            if (!I18N[lang]) return;
            currentLang = lang;

            // Update active flag button
            toggleEl.querySelectorAll('.lang-flag').forEach(function (f) {
                f.classList.toggle('active', f.dataset.lang === lang);
            });

            // Update all i18n text nodes
            var strings = I18N[lang];
            document.querySelectorAll('[data-i18n]').forEach(function (el) {
                var key = el.dataset.i18n;
                if (strings[key] !== undefined) {
                    el.innerHTML = strings[key];
                }
            });

            // Update 2D shape button names
            document.getElementById('selector-2d').querySelectorAll('.shape-btn').forEach(function (btn) {
                var key = btn.dataset.shape;
                if (SHAPE_BTN_NAMES_2D[key]) btn.textContent = SHAPE_BTN_NAMES_2D[key][lang];
            });

            // Update 3D shape button names
            document.getElementById('selector-3d').querySelectorAll('.shape-btn').forEach(function (btn) {
                var key = btn.dataset.shape;
                if (SHAPE_BTN_NAMES_3D[key]) btn.textContent = SHAPE_BTN_NAMES_3D[key][lang];
            });

            // Re-render current 2D shape formulas and title
            var shape2d = SHAPES_2D[current2DKey];
            if (shape2d) {
                var canvasEl = document.getElementById('canvas-2d');
                var titleEl = canvasEl.querySelector('.shape-title');
                if (titleEl) titleEl.textContent = shape2d.name[lang];
                renderFormulas(document.getElementById('formulas-2d'), shape2d.formulas[lang]);
            }

            // Re-render current 3D shape formulas and title
            var shape3d = SHAPES_3D[current3DKey];
            if (shape3d) {
                var container3d = document.getElementById('canvas-3d');
                var title3d = container3d.querySelector('.shape-title');
                if (title3d) title3d.textContent = shape3d.name[lang];
                renderFormulas(document.getElementById('formulas-3d'), shape3d.formulas[lang]);
            }

            // Re-render misc
            renderMisc();
            saveModuleState();
        }

        toggleEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.lang-flag');
            if (!btn) return;
            var lang = btn.dataset.lang;
            if (lang === currentLang) return;
            applyLanguage(lang);
        });

        applyLanguage(currentLang);
    }

    // ===== INIT =====
    function init() {
        createParticles();
        initThree();
        init2D();
        init3D();
        initMisc();
        initNav();
        initReveal();
        initLang();

        if (initialScrollY > 0) {
            window.setTimeout(function () {
                window.scrollTo(0, initialScrollY);
            }, 40);
        }

        var saveTimer = null;
        window.addEventListener('scroll', function () {
            if (saveTimer) window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(function () {
                saveModuleState();
            }, 180);
        }, { passive: true });
        window.addEventListener('beforeunload', saveModuleState);
        saveModuleState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
