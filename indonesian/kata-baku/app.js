/**
 * Kata Baku - Swipe Flashcard App
 * Swipe right = Baku, swipe left = Tidak Baku.
 * Includes local resume state.
 */
(function () {
    'use strict';

    var MODULE_STATE_KEY = 'indo-kata-baku';
    var BATCH_SIZE = 30;
    var SWIPE_THRESHOLD = 60;

    // DOM
    var fcStage = document.getElementById('fc-stage');
    var flashcard = document.getElementById('flashcard');
    var fcWord = document.getElementById('fc-word');
    var feedback = document.getElementById('feedback');
    var fbIcon = document.getElementById('fb-icon');
    var fbText = document.getElementById('fb-text');
    var fbDetail = document.getElementById('fb-detail');
    var fbNext = document.getElementById('fb-next');
    var btnBaku = document.getElementById('btn-baku');
    var btnTidak = document.getElementById('btn-tidak');
    var swipeButtons = document.getElementById('swipe-buttons');
    var scoreEl = document.getElementById('score');
    var streakEl = document.getElementById('streak');
    var progressEl = document.getElementById('progress');
    var endScreen = document.getElementById('end-screen');
    var endScore = document.getElementById('end-score');
    var restartBtn = document.getElementById('restart-btn');

    var deck = [];
    var currentIndex = 0;
    var score = 0;
    var streak = 0;
    var bestStreak = 0;
    var answered = false;
    var phase = 'question'; // question | feedback | end
    var lastFeedback = null;
    var rewardsGranted = false;

    // Touch tracking
    var touchStartX = 0;
    var touchStartY = 0;
    var touchDeltaX = 0;
    var isSwiping = false;

    init();

    function loadState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.load !== 'function') return null;
        return window.BrainGymModuleState.load(MODULE_STATE_KEY, null);
    }

    function saveState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.save !== 'function') return;
        window.BrainGymModuleState.save(MODULE_STATE_KEY, {
            deck: deck,
            currentIndex: currentIndex,
            score: score,
            streak: streak,
            bestStreak: bestStreak,
            answered: answered,
            phase: phase,
            lastFeedback: lastFeedback,
            rewardsGranted: rewardsGranted
        });
    }

    function clearState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.clear !== 'function') return;
        window.BrainGymModuleState.clear(MODULE_STATE_KEY);
    }

    function init() {
        var saved = loadState();
        if (!restoreFromState(saved)) {
            startNewSession();
        }
    }

    function restoreFromState(saved) {
        if (!saved || typeof saved !== 'object') return false;
        if (!Array.isArray(saved.deck) || saved.deck.length === 0) return false;

        deck = saved.deck
            .filter(isValidDeckItem)
            .slice(0, BATCH_SIZE);
        if (deck.length === 0) return false;

        currentIndex = clampIndex(saved.currentIndex, deck.length);
        score = toNonNegativeInt(saved.score);
        streak = toNonNegativeInt(saved.streak);
        bestStreak = toNonNegativeInt(saved.bestStreak);
        answered = Boolean(saved.answered);
        phase = normalizePhase(saved.phase);
        rewardsGranted = Boolean(saved.rewardsGranted);
        lastFeedback = saved.lastFeedback && typeof saved.lastFeedback === 'object'
            ? saved.lastFeedback
            : null;

        if (phase === 'question') {
            answered = false;
            lastFeedback = null;
        }
        if (phase === 'feedback' && (!lastFeedback || !isValidDeckItem(lastFeedback.item))) {
            phase = 'question';
            answered = false;
            lastFeedback = null;
        }

        updateUI();

        if (phase === 'end') {
            showEndScreen(true);
            return true;
        }

        if (phase === 'feedback' && lastFeedback && lastFeedback.item) {
            showFeedback(lastFeedback.item, Boolean(lastFeedback.correct));
            return true;
        }

        showCard();
        return true;
    }

    function normalizePhase(value) {
        if (value === 'feedback' || value === 'end') return value;
        return 'question';
    }

    function isValidDeckItem(item) {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.kata !== 'string' || item.kata.trim() === '') return false;
        if (typeof item.isBaku !== 'boolean') return false;
        if (!item.isBaku && (typeof item.bentukBaku !== 'string' || item.bentukBaku.trim() === '')) return false;
        return true;
    }

    function startNewSession() {
        deck = shuffle(KATA_BAKU_DATA.slice()).slice(0, BATCH_SIZE);
        currentIndex = 0;
        score = 0;
        streak = 0;
        bestStreak = 0;
        answered = false;
        phase = 'question';
        lastFeedback = null;
        rewardsGranted = false;

        endScreen.classList.add('hidden');
        fcStage.classList.remove('hidden');
        swipeButtons.classList.remove('hidden');
        feedback.classList.add('hidden');

        updateUI();
        showCard();
        saveState();
    }

    function toNonNegativeInt(value) {
        var n = Number(value);
        if (!Number.isFinite(n) || n < 0) return 0;
        return Math.floor(n);
    }

    function clampIndex(value, maxLength) {
        var idx = toNonNegativeInt(value);
        if (idx >= maxLength) return Math.max(maxLength - 1, 0);
        return idx;
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function showCard() {
        if (currentIndex >= deck.length) {
            showEndScreen(false);
            return;
        }

        answered = false;
        phase = 'question';
        lastFeedback = null;

        var item = deck[currentIndex];
        fcWord.textContent = item.kata;

        flashcard.className = 'flashcard';
        flashcard.style.transform = '';
        flashcard.style.borderColor = '';
        fcStage.classList.remove('hidden');
        swipeButtons.classList.remove('hidden');
        feedback.classList.add('hidden');
        endScreen.classList.add('hidden');
        saveState();
    }

    function answer(userSaysBaku) {
        if (answered) return;
        answered = true;

        var item = deck[currentIndex];
        var correct = (userSaysBaku === item.isBaku);

        if (correct) {
            score += 1;
            streak += 1;
            if (streak > bestStreak) bestStreak = streak;
        } else {
            streak = 0;
        }

        lastFeedback = { item: item, correct: correct };
        phase = 'feedback';
        updateUI();
        saveState();

        var dir = userSaysBaku ? 'swipe-right' : 'swipe-left';
        flashcard.classList.add(dir);

        window.setTimeout(function () {
            fcStage.classList.add('hidden');
            swipeButtons.classList.add('hidden');
            showFeedback(item, correct);
            saveState();
        }, 350);
    }

    function showFeedback(item, correct) {
        phase = 'feedback';
        lastFeedback = { item: item, correct: correct };
        fcStage.classList.add('hidden');
        feedback.classList.remove('hidden', 'correct', 'wrong');
        feedback.classList.add(correct ? 'correct' : 'wrong');
        endScreen.classList.add('hidden');

        fbIcon.innerHTML = correct
            ? '<img src="../../icon/correct.svg" alt="Benar" width="32" height="32">'
            : '<img src="../../icon/incorrect.svg" alt="Salah" width="32" height="32">';
        fbText.textContent = correct ? 'Benar!' : 'Salah!';

        if (item.isBaku) {
            fbDetail.innerHTML = '<strong>"' + escHtml(item.kata) + '"</strong> adalah kata <strong>Baku</strong>.';
        } else {
            fbDetail.innerHTML = '"' + escHtml(item.kata) + '" adalah <strong>Tidak Baku</strong>. Bentuk bakunya: <strong>"' + escHtml(item.bentukBaku) + '"</strong>.';
        }
    }

    function nextCard() {
        currentIndex += 1;
        showCard();
        updateUI();
        saveState();
    }

    function awardCompletionRewards() {
        if (rewardsGranted || typeof Gamification === 'undefined') return;
        Gamification.addScore(score);
        Gamification.recordActivity('indo-baku', score);
        rewardsGranted = true;
    }

    function showEndScreen(fromRestore) {
        phase = 'end';
        fcStage.classList.add('hidden');
        swipeButtons.classList.add('hidden');
        feedback.classList.add('hidden');
        endScreen.classList.remove('hidden');

        var pct = deck.length > 0 ? Math.round((score / deck.length) * 100) : 0;
        endScore.textContent = 'Skor: ' + score + ' / ' + deck.length + ' (' + pct + '%) - Streak terbaik: ' + bestStreak;

        if (!fromRestore) {
            awardCompletionRewards();
        }

        saveState();
    }

    function updateUI() {
        scoreEl.textContent = score;
        streakEl.textContent = streak;
        var current = Math.min(currentIndex + 1, deck.length || 0);
        progressEl.textContent = current + ' / ' + deck.length;
    }

    btnBaku.addEventListener('click', function () { answer(true); });
    btnTidak.addEventListener('click', function () { answer(false); });
    fbNext.addEventListener('click', nextCard);
    restartBtn.addEventListener('click', function () {
        clearState();
        startNewSession();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' && !answered && phase === 'question') {
            answer(true);
        } else if (e.key === 'ArrowLeft' && !answered && phase === 'question') {
            answer(false);
        } else if ((e.key === 'Enter' || e.key === ' ') && phase === 'feedback') {
            e.preventDefault();
            nextCard();
        }
    });

    fcStage.addEventListener('touchstart', function (e) {
        if (answered || phase !== 'question') return;
        var t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchDeltaX = 0;
        isSwiping = false;
        flashcard.classList.add('swiping');
    }, { passive: true });

    fcStage.addEventListener('touchmove', function (e) {
        if (answered || phase !== 'question') return;
        var t = e.touches[0];
        touchDeltaX = t.clientX - touchStartX;
        var deltaY = Math.abs(t.clientY - touchStartY);

        if (Math.abs(touchDeltaX) > 10 && Math.abs(touchDeltaX) > deltaY) {
            isSwiping = true;
            e.preventDefault();
            var rotation = touchDeltaX * 0.06;
            flashcard.style.transform = 'translateX(' + touchDeltaX + 'px) rotate(' + rotation + 'deg)';

            if (touchDeltaX > 30) {
                flashcard.style.borderColor = 'var(--accent-green)';
            } else if (touchDeltaX < -30) {
                flashcard.style.borderColor = 'var(--accent-red)';
            } else {
                flashcard.style.borderColor = '';
            }
        }
    }, { passive: false });

    fcStage.addEventListener('touchend', function () {
        if (answered || phase !== 'question') return;
        flashcard.classList.remove('swiping');
        flashcard.style.borderColor = '';

        if (isSwiping && Math.abs(touchDeltaX) > SWIPE_THRESHOLD) {
            answer(touchDeltaX > 0);
        } else {
            flashcard.style.transform = '';
        }
    });

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    window.addEventListener('beforeunload', saveState);
})();
