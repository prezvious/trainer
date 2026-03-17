/**
 * Brain Gym - Homepage App
 * Initializes dashboard metrics, chart rendering, and ambient visuals.
 */

(function () {
    'use strict';

    var prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function toPositiveNumber(value) {
        var n = Number(value);
        if (!Number.isFinite(n) || n < 0) return 0;
        return n;
    }

    function readJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function createParticles() {
        var container = document.getElementById('particles');
        if (!container || prefersReducedMotion) return;

        container.innerHTML = '';

        var colors = [
            'rgba(165, 197, 235, 0.30)',
            'rgba(239, 187, 204, 0.30)',
            'rgba(194, 232, 206, 0.28)',
            'rgba(244, 221, 171, 0.24)'
        ];

        for (var i = 0; i < 14; i += 1) {
            var p = document.createElement('div');
            p.className = 'particle';

            var size = Math.random() * 5 + 2;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay = Math.random() * 12 + 's';
            p.style.animationDuration = Math.random() * 8 + 14 + 's';

            container.appendChild(p);
        }
    }

    function animateNumber(el, target, duration) {
        if (!el) return;

        var safeTarget = toPositiveNumber(target);
        if (prefersReducedMotion) {
            el.textContent = String(Math.round(safeTarget));
            return;
        }

        var totalDuration = toPositiveNumber(duration) || 1000;
        var startTime = performance.now();

        function step(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / totalDuration, 1);
            var eased = 1 - (1 - progress) * (1 - progress);
            el.textContent = String(Math.round(safeTarget * eased));
            if (progress < 1) window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
    }

    function syncMathTrainerData() {
        var data = readJson('mentalMathData', null);
        if (!data) return;

        var totalProblems = toPositiveNumber(data.totalProblems);
        if (typeof Gamification !== 'undefined' && typeof Gamification.syncLegacyMathScore === 'function') {
            Gamification.syncLegacyMathScore(totalProblems);
        }
    }

    function initDashboard() {
        syncMathTrainerData();
        if (typeof Gamification === 'undefined') return;

        var streak = Gamification.getStreak();
        var score = Gamification.getScore();
        var todayCount = Gamification.getTodayCount();

        animateNumber(document.getElementById('streak-count'), streak.count, 700);
        animateNumber(document.getElementById('total-score'), score, 1100);
        animateNumber(document.getElementById('today-count'), todayCount, 700);
    }

    function renderChart() {
        var chart = document.getElementById('weekly-chart');
        if (!chart || typeof Gamification === 'undefined') return;

        var stats = Gamification.getDailyStats(7);
        var maxCount = Math.max.apply(null, stats.map(function (s) {
            return toPositiveNumber(s.count);
        }).concat([1]));

        chart.innerHTML = '';

        stats.forEach(function (day, index) {
            var count = toPositiveNumber(day.count);

            var col = document.createElement('div');
            col.className = 'bar-col';

            var countEl = document.createElement('span');
            countEl.className = 'bar-count';
            countEl.textContent = String(count);

            var bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = prefersReducedMotion ? Math.max((count / maxCount) * 100, 3) + '%' : '0%';

            var label = document.createElement('span');
            label.className = 'bar-label';
            label.textContent = day.label;

            bar.setAttribute('role', 'img');
            bar.setAttribute('aria-label', day.label + ': ' + count + ' activities');

            col.appendChild(countEl);
            col.appendChild(bar);
            bar.appendChild(label);
            chart.appendChild(col);

            if (!prefersReducedMotion) {
                window.setTimeout(function () {
                    bar.style.height = Math.max((count / maxCount) * 100, 3) + '%';
                }, 120 + index * 70);
            }
        });
    }

    function getTypeLabel(type) {
        if (type === 'formula') return 'Formula Notes';
        if (type === 'grammar') return 'Grammar Flashcards';
        return 'Vocabulary';
    }

    function formatTimeUntil(timestamp) {
        var due = Number(timestamp);
        if (!Number.isFinite(due)) return 'Due soon';

        var delta = due - Date.now();
        if (delta <= 0) return 'Due now';

        var hours = Math.ceil(delta / (60 * 60 * 1000));
        if (hours < 24) return 'Due in ' + hours + 'h';

        var days = Math.ceil(hours / 24);
        return 'Due in ' + days + 'd';
    }

    function renderReviewQueue() {
        var listEl = document.getElementById('review-list');
        var subtitleEl = document.getElementById('review-queue-subtitle');
        if (!listEl || !subtitleEl) return;

        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.getDueItems !== 'function') {
            listEl.innerHTML = '';
            return;
        }

        var summary = window.BrainGymReviewQueue.getSummary();
        var dueItems = window.BrainGymReviewQueue.getDueItems(8);

        if (summary.dueCount > 0) {
            subtitleEl.textContent = summary.dueCount + ' item' + (summary.dueCount === 1 ? '' : 's') + ' ready to review.';
        } else if (summary.nextDueAt) {
            subtitleEl.textContent = 'No items due now. ' + formatTimeUntil(summary.nextDueAt) + '.';
        } else {
            subtitleEl.textContent = 'Add formula favorites, dictionary searches, and grammar cards to build your queue.';
        }

        listEl.innerHTML = '';
        if (dueItems.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'review-empty';
            empty.textContent = 'Nothing due right now. Keep training and this queue will fill automatically.';
            listEl.appendChild(empty);
            return;
        }

        dueItems.forEach(function (item) {
            var link = document.createElement('a');
            link.className = 'review-item';
            link.href = item.href;

            var main = document.createElement('div');
            main.className = 'review-item-main';

            var title = document.createElement('p');
            title.className = 'review-item-title';
            title.textContent = item.title;

            var sub = document.createElement('p');
            sub.className = 'review-item-sub';
            sub.textContent = getTypeLabel(item.type) + ' • ' + formatTimeUntil(item.dueAt);

            main.appendChild(title);
            main.appendChild(sub);

            var cta = document.createElement('span');
            cta.className = 'review-item-cta';
            cta.textContent = 'Review ->';

            link.appendChild(main);
            link.appendChild(cta);
            listEl.appendChild(link);
        });
    }

    function seedReviewQueueFromLocal() {
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.seed !== 'function') return;
        var canReadItem = typeof window.BrainGymReviewQueue.getItem === 'function';

        var favoriteFormulas = readJson('formulaFavorites', []);
        if (Array.isArray(favoriteFormulas)) {
            favoriteFormulas.forEach(function (formulaId) {
                if (typeof formulaId !== 'string' || !formulaId.trim()) return;
                var reviewId = typeof window.BrainGymReviewQueue.formulaId === 'function'
                    ? window.BrainGymReviewQueue.formulaId(formulaId)
                    : 'formula:' + formulaId;
                if (canReadItem && window.BrainGymReviewQueue.getItem(reviewId)) return;

                window.BrainGymReviewQueue.seed({
                    id: reviewId,
                    type: 'formula',
                    title: 'Formula ' + formulaId.toUpperCase(),
                    subtitle: 'Formula Notes',
                    href: 'formula-notes/index.html?formula=' + encodeURIComponent(formulaId) +
                        '&review=' + encodeURIComponent(reviewId)
                });
            });
        }

        var dictHistory = readJson('brainGymDictHistory', []);
        if (Array.isArray(dictHistory)) {
            dictHistory.forEach(function (word) {
                if (typeof word !== 'string' || !word.trim()) return;
                var safeWord = word.trim().toLowerCase();
                var reviewId = typeof window.BrainGymReviewQueue.vocabId === 'function'
                    ? window.BrainGymReviewQueue.vocabId(safeWord)
                    : 'vocab:' + safeWord;
                if (canReadItem && window.BrainGymReviewQueue.getItem(reviewId)) return;

                window.BrainGymReviewQueue.seed({
                    id: reviewId,
                    type: 'vocab',
                    title: safeWord,
                    subtitle: 'English Dictionary',
                    href: 'english/dictionary/index.html?word=' + encodeURIComponent(safeWord) +
                        '&review=' + encodeURIComponent(reviewId)
                });
            });
        }
    }

    function lockHeroLoopContextMenu() {
        var loop = document.querySelector('.hero-loop');
        if (!loop) return;

        loop.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });

        var images = loop.querySelectorAll('img');
        for (var i = 0; i < images.length; i += 1) {
            images[i].setAttribute('draggable', 'false');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        lockHeroLoopContextMenu();
        createParticles();
        initDashboard();
        renderChart();
        seedReviewQueueFromLocal();
        renderReviewQueue();
    });

    window.addEventListener('brain-gym:gamification-updated', function () {
        initDashboard();
        renderChart();
    });

    window.addEventListener('focus', function () {
        seedReviewQueueFromLocal();
        renderReviewQueue();
    });
})();
