/**
 * Analogi - MCQ Quiz App
 * Includes local resume state.
 */
(function () {
    'use strict';

    var MODULE_STATE_KEY = 'indo-analogi';
    var BATCH_SIZE = 20;

    // DOM
    var qNumber = document.getElementById('q-number');
    var qText = document.getElementById('q-text');
    var optionsEl = document.getElementById('options');
    var questionCard = document.getElementById('question-card');
    var pembahasan = document.getElementById('pembahasan');
    var pembHeader = document.getElementById('pemb-header');
    var pembText = document.getElementById('pemb-text');
    var nextBtn = document.getElementById('next-btn');
    var correctCountEl = document.getElementById('correct-count');
    var progressEl = document.getElementById('progress');
    var accuracyEl = document.getElementById('accuracy');
    var progressFill = document.getElementById('progress-fill');
    var endScreen = document.getElementById('end-screen');
    var endTitle = document.getElementById('end-title');
    var endScore = document.getElementById('end-score');
    var endBreakdown = document.getElementById('end-breakdown');
    var restartBtn = document.getElementById('restart-btn');

    var questions = [];
    var currentIndex = 0;
    var correctCount = 0;
    var answered = false;
    var selectedLetter = null;
    var phase = 'question'; // question | feedback | end
    var rewardsGranted = false;

    init();

    function loadState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.load !== 'function') return null;
        return window.BrainGymModuleState.load(MODULE_STATE_KEY, null);
    }

    function saveState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.save !== 'function') return;
        window.BrainGymModuleState.save(MODULE_STATE_KEY, {
            questions: questions,
            currentIndex: currentIndex,
            correctCount: correctCount,
            answered: answered,
            selectedLetter: selectedLetter,
            phase: phase,
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
        if (!Array.isArray(saved.questions) || saved.questions.length === 0) return false;

        questions = saved.questions
            .filter(isValidQuestion)
            .slice(0, BATCH_SIZE);
        if (questions.length === 0) return false;

        currentIndex = clampIndex(saved.currentIndex, questions.length);
        correctCount = toNonNegativeInt(saved.correctCount);
        answered = Boolean(saved.answered);
        selectedLetter = normalizeSelectedLetter(saved.selectedLetter);
        phase = normalizePhase(saved.phase);
        rewardsGranted = Boolean(saved.rewardsGranted);

        if (phase === 'question') {
            answered = false;
            selectedLetter = null;
        }
        if (phase === 'feedback' && !selectedLetter) {
            phase = 'question';
            answered = false;
        }

        if (phase === 'end') {
            showEndScreen(true);
            updateUI();
            return true;
        }

        showQuestion();
        if (phase === 'feedback' && selectedLetter) {
            applyAnsweredState(selectedLetter, true);
        }
        updateUI();
        return true;
    }

    function normalizePhase(value) {
        if (value === 'feedback' || value === 'end') return value;
        return 'question';
    }

    function normalizeSelectedLetter(value) {
        if (typeof value !== 'string') return null;
        var safe = value.trim().toLowerCase();
        return (safe === 'a' || safe === 'b' || safe === 'c' || safe === 'd') ? safe : null;
    }

    function isValidQuestion(q) {
        return q && typeof q === 'object' &&
            typeof q.soal === 'string' &&
            q.pilihan && typeof q.pilihan === 'object' &&
            typeof q.jawaban === 'string' &&
            (q.jawaban === 'a' || q.jawaban === 'b' || q.jawaban === 'c' || q.jawaban === 'd') &&
            typeof q.pembahasan === 'string';
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

    function startNewSession() {
        questions = shuffle(ANALOGI_DATA.slice()).slice(0, BATCH_SIZE);
        currentIndex = 0;
        correctCount = 0;
        answered = false;
        selectedLetter = null;
        phase = 'question';
        rewardsGranted = false;

        endScreen.classList.add('hidden');
        questionCard.classList.remove('hidden');
        pembahasan.classList.add('hidden');

        showQuestion();
        updateUI();
        saveState();
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function showQuestion() {
        if (currentIndex >= questions.length) {
            showEndScreen(false);
            return;
        }

        answered = false;
        selectedLetter = null;
        phase = 'question';
        var q = questions[currentIndex];

        qNumber.textContent = 'Soal ' + (currentIndex + 1);
        qText.textContent = q.soal;

        optionsEl.innerHTML = '';
        var letters = ['a', 'b', 'c', 'd'];
        letters.forEach(function (letter) {
            if (!q.pilihan[letter]) return;

            var btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.dataset.letter = letter;

            var letterEl = document.createElement('div');
            letterEl.className = 'option-letter';
            letterEl.textContent = letter.toUpperCase();

            var textEl = document.createElement('span');
            textEl.className = 'option-text';
            textEl.textContent = q.pilihan[letter];

            btn.appendChild(letterEl);
            btn.appendChild(textEl);
            btn.addEventListener('click', function () {
                if (answered) return;
                applyAnsweredState(letter, false);
            });

            optionsEl.appendChild(btn);
        });

        questionCard.classList.remove('hidden');
        pembahasan.classList.add('hidden');
        endScreen.classList.add('hidden');
        saveState();
    }

    function applyAnsweredState(letter, fromRestore) {
        if (answered && !fromRestore) return;
        var q = questions[currentIndex];
        if (!q) return;

        answered = true;
        selectedLetter = letter;
        phase = 'feedback';

        var isCorrect = (letter === q.jawaban);
        if (!fromRestore && isCorrect) {
            correctCount += 1;
        }

        var buttons = optionsEl.querySelectorAll('.option-btn');
        buttons.forEach(function (btn) {
            btn.classList.remove('correct', 'wrong', 'dimmed', 'disabled');
            btn.classList.add('disabled');
            var l = btn.dataset.letter;

            if (l === q.jawaban) {
                btn.classList.add('correct');
            } else if (l === letter && !isCorrect) {
                btn.classList.add('wrong');
            } else {
                btn.classList.add('dimmed');
            }
        });

        pembahasan.classList.remove('hidden', 'correct-answer', 'wrong-answer');
        pembahasan.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');

        pembHeader.innerHTML = isCorrect
            ? '<img src="../../icon/correct.svg" alt="" width="18" height="18" class="inline-icon"> Benar!'
            : '<img src="../../icon/incorrect.svg" alt="" width="18" height="18" class="inline-icon"> Salah - Jawaban: ' + escHtml(q.jawaban.toUpperCase()) + '. ' + escHtml(q.pilihan[q.jawaban]);
        pembText.textContent = q.pembahasan;

        updateUI();
        saveState();
    }

    function nextQuestion() {
        currentIndex += 1;
        showQuestion();
        updateUI();
        saveState();
    }

    function showEndScreen(fromRestore) {
        phase = 'end';
        questionCard.classList.add('hidden');
        pembahasan.classList.add('hidden');
        endScreen.classList.remove('hidden');

        var total = questions.length || 1;
        var pct = Math.round((correctCount / total) * 100);

        if (pct >= 80) {
            endTitle.innerHTML = '<img src="../../icon/party-popper.svg" alt="" width="24" height="24" class="inline-icon"> Luar Biasa!';
        } else if (pct >= 60) {
            endTitle.innerHTML = '<img src="../../icon/correct.svg" alt="" width="24" height="24" class="inline-icon"> Bagus!';
        } else {
            endTitle.innerHTML = '<img src="../../icon/books-svgrepo-com.svg" alt="" width="24" height="24" class="inline-icon"> Terus Berlatih!';
        }

        endScore.textContent = 'Skor: ' + correctCount + ' / ' + total + ' (' + pct + '%)';
        endBreakdown.textContent = 'Benar: ' + correctCount + ' soal - Salah: ' + (total - correctCount) + ' soal';

        if (!fromRestore && !rewardsGranted && typeof Gamification !== 'undefined') {
            Gamification.addScore(correctCount);
            Gamification.recordActivity('indo-analogi', correctCount);
            rewardsGranted = true;
        }

        saveState();
    }

    function updateUI() {
        correctCountEl.textContent = correctCount;
        var total = questions.length || 0;
        progressEl.textContent = Math.min(currentIndex + 1, total) + ' / ' + total;

        var attempted = answered ? currentIndex + 1 : currentIndex;
        if (attempted > 0) {
            accuracyEl.textContent = Math.round((correctCount / attempted) * 100) + '%';
        } else {
            accuracyEl.textContent = '-';
        }

        progressFill.style.width = (total > 0 ? ((currentIndex + (answered ? 1 : 0)) / total * 100) : 0) + '%';
    }

    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', function () {
        clearState();
        startNewSession();
    });

    document.addEventListener('keydown', function (e) {
        if (phase === 'question' && !answered) {
            var letters = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd' };
            var key = e.key.toLowerCase();
            var q = questions[currentIndex];
            if (letters[key] && q && q.pilihan && q.pilihan[letters[key]]) {
                applyAnsweredState(letters[key], false);
            }
        } else if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            nextQuestion();
        }
    });

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    window.addEventListener('beforeunload', saveState);
})();
