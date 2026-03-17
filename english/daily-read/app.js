/**
 * Daily Read — App
 * Loads today's article based on day-of-week, wraps words for click-to-define,
 * integrates pop-up dictionary via Free Dictionary API, and quiz engine.
 */
(function () {
    'use strict';

    var API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MODULE_STATE_KEY = 'english-daily-read';

    // ── DOM Refs ──
    var topicBadge = document.getElementById('topic-badge');
    var metaDate = document.getElementById('meta-date');
    var metaWords = document.getElementById('meta-words');
    var articleTitle = document.getElementById('article-title');
    var articleBody = document.getElementById('article-body');
    var dictPopup = document.getElementById('dict-popup');
    var popupWord = document.getElementById('popup-word');
    var popupClose = document.getElementById('popup-close');
    var popupLoading = document.getElementById('popup-loading');
    var popupContent = document.getElementById('popup-content');
    var popupFullLink = document.getElementById('popup-full-link');
    var quizSection = document.getElementById('quiz-section');
    var quizList = document.getElementById('quiz-list');
    var quizSubmit = document.getElementById('quiz-submit');
    var quizResult = document.getElementById('quiz-result');
    var quizScore = document.getElementById('quiz-score');

    var currentArticle = null;
    var selectedAnswers = {};
    var quizSubmitted = false;

    // ── Init ──
    loadTodaysArticle();

    popupClose.addEventListener('click', function () {
        dictPopup.classList.add('hidden');
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') dictPopup.classList.add('hidden');
    });

    function getLocalDayKey() {
        var now = new Date();
        return now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
    }

    // ── Load Article ──
    function loadTodaysArticle() {
        var todayKey = getLocalDayKey();
        var saved = loadResumeState();

        if (saved && saved.dayKey === todayKey && saved.articleId) {
            var resumed = findArticleById(saved.articleId);
            if (resumed) {
                currentArticle = resumed;
                selectedAnswers = saved.selectedAnswers && typeof saved.selectedAnswers === 'object'
                    ? saved.selectedAnswers
                    : {};
                quizSubmitted = Boolean(saved.quizSubmitted);
                renderArticle();
                return;
            }
        }

        var today = DAYS[new Date().getDay()];

        // Find articles matching today's day
        var todaysArticles = ARTICLES.filter(function (a) { return a.day === today; });

        if (todaysArticles.length === 0) {
            // Fallback: pick by day index
            currentArticle = ARTICLES[new Date().getDay() % ARTICLES.length];
        } else {
            // If multiple articles for same day, rotate by week number
            var weekNum = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
            currentArticle = todaysArticles[weekNum % todaysArticles.length];
        }

        selectedAnswers = {};
        quizSubmitted = false;
        saveResumeState();
        renderArticle();
    }

    function findArticleById(articleId) {
        return ARTICLES.find(function (article) {
            return article.id === articleId;
        }) || null;
    }

    function loadResumeState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.load !== 'function') return null;
        return window.BrainGymModuleState.load(MODULE_STATE_KEY, null);
    }

    function saveResumeState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.save !== 'function') return;
        if (!currentArticle || !currentArticle.id) return;
        window.BrainGymModuleState.save(MODULE_STATE_KEY, {
            articleId: currentArticle.id,
            selectedAnswers: selectedAnswers,
            quizSubmitted: quizSubmitted,
            dayKey: getLocalDayKey()
        });
    }

    // ── Render Article ──
    function renderArticle() {
        var article = currentArticle;

        // Meta
        topicBadge.textContent = article.topic;
        var now = new Date();
        metaDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Count words
        var fullText = article.body.join(' ');
        var wordCount = fullText.split(/\s+/).length;
        metaWords.textContent = wordCount + ' words';

        // Title
        articleTitle.textContent = article.title;

        // Body — wrap each word in a clickable span
        articleBody.innerHTML = '';
        article.body.forEach(function (paragraph) {
            var p = document.createElement('p');
            p.innerHTML = wrapWords(paragraph);
            articleBody.appendChild(p);
        });

        // Bind word clicks
        articleBody.querySelectorAll('.word-span').forEach(function (span) {
            span.addEventListener('click', function () {
                var word = cleanWord(span.textContent);
                if (word.length >= 2) {
                    span.classList.add('looked-up');
                    showPopupDictionary(word);
                }
            });
        });

        // Quiz
        renderQuiz(article.questions);
    }

    // ── Wrap Words ──
    function wrapWords(text) {
        // Split on word boundaries, keeping punctuation attached to words
        return text.replace(/(\S+)/g, function (match) {
            return '<span class="word-span">' + escHtml(match) + '</span>';
        });
    }

    function cleanWord(raw) {
        // Strip punctuation from start/end
        return raw.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
    }

    // ── Pop-up Dictionary ──
    function showPopupDictionary(word) {
        dictPopup.classList.remove('hidden');
        popupWord.textContent = word;
        popupContent.innerHTML = '';
        popupLoading.classList.remove('hidden');
        popupFullLink.href = '../dictionary/index.html?word=' + encodeURIComponent(word);

        fetch(API_BASE + encodeURIComponent(word))
            .then(function (res) {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then(function (data) {
                popupLoading.classList.add('hidden');
                renderPopupResults(data);
            })
            .catch(function () {
                popupLoading.classList.add('hidden');
                popupContent.innerHTML = '<p class="popup-empty">No definition found for "' + escHtml(word) + '".</p>';
            });
    }

    function renderPopupResults(data) {
        var html = '';
        // v2: data is an array
        if (!Array.isArray(data) || data.length === 0) {
            popupContent.innerHTML = '<p class="popup-empty">No detailed definitions available.</p>';
            return;
        }

        var wordEntry = data[0];

        // Phonetics
        if (wordEntry.phonetics) {
            wordEntry.phonetics.forEach(function (p) {
                if (p.text) {
                    html += '<div class="popup-pronunciation">' + escHtml(p.text) + '</div>';
                    return;
                }
            });
        }

        // Show first 2 meanings max
        var meanings = (wordEntry.meanings || []).slice(0, 2);
        meanings.forEach(function (meaning) {
            if (meaning.partOfSpeech) {
                html += '<div class="popup-pos">' + escHtml(meaning.partOfSpeech) + '</div>';
            }

            // Max 3 definitions per meaning
            var defs = (meaning.definitions || []).slice(0, 3);
            defs.forEach(function (def, i) {
                html += '<div class="popup-def"><span class="popup-def-num">' + (i + 1) + '.</span> ' + escHtml(def.definition || '') + '</div>';
                if (def.example) {
                    html += '<div class="popup-example">"' + escHtml(def.example) + '"</div>';
                }
            });
        });

        popupContent.innerHTML = html || '<p class="popup-empty">No detailed definitions available.</p>';
    }

    // ── Quiz ──
    function renderQuiz(questions) {
        if (!questions || questions.length === 0) return;

        quizSection.classList.remove('hidden');
        quizSubmit.classList.toggle('hidden', quizSubmitted);
        quizResult.classList.toggle('hidden', !quizSubmitted);

        quizList.innerHTML = '';
        questions.forEach(function (q, qi) {
            var item = document.createElement('div');
            item.className = 'quiz-item';

            var qText = document.createElement('div');
            qText.className = 'quiz-question';
            qText.textContent = (qi + 1) + '. ' + q.q;
            item.appendChild(qText);

            var options = document.createElement('div');
            options.className = 'quiz-options';

            q.options.forEach(function (opt, oi) {
                var optEl = document.createElement('button');
                optEl.type = 'button';
                optEl.className = 'quiz-option';
                optEl.dataset.question = qi;
                optEl.dataset.option = oi;
                optEl.setAttribute('aria-pressed', 'false');

                var radio = document.createElement('div');
                radio.className = 'quiz-radio';
                optEl.appendChild(radio);

                var label = document.createElement('span');
                label.textContent = opt;
                optEl.appendChild(label);

                optEl.addEventListener('click', function () {
                    if (quizSubmitted) return;
                    // Deselect siblings
                    options.querySelectorAll('.quiz-option').forEach(function (o) {
                        o.classList.remove('selected');
                        o.setAttribute('aria-pressed', 'false');
                    });
                    optEl.classList.add('selected');
                    optEl.setAttribute('aria-pressed', 'true');
                    selectedAnswers[qi] = oi;
                    saveResumeState();
                });

                if (selectedAnswers[qi] === oi) {
                    optEl.classList.add('selected');
                    optEl.setAttribute('aria-pressed', 'true');
                }

                options.appendChild(optEl);
            });

            item.appendChild(options);
            quizList.appendChild(item);
        });

        quizSubmit.onclick = function () { checkQuizAnswers(questions, { fromRestore: false }); };

        if (quizSubmitted) {
            checkQuizAnswers(questions, { fromRestore: true });
        }
    }

    function checkQuizAnswers(questions, options) {
        options = options || {};
        var fromRestore = Boolean(options.fromRestore);
        if (quizSubmitted && !fromRestore) return;

        quizSubmitted = true;
        var correct = 0;

        questions.forEach(function (q, qi) {
            var optionEls = quizList.querySelectorAll('[data-question="' + qi + '"]');
            optionEls.forEach(function (opt) {
                var oi = parseInt(opt.dataset.option, 10);
                opt.style.pointerEvents = 'none'; // disable further clicks

                if (oi === q.answer) {
                    opt.classList.add('correct');
                }

                if (selectedAnswers[qi] === oi && oi !== q.answer) {
                    opt.classList.add('wrong');
                }
            });

            if (selectedAnswers[qi] === q.answer) correct++;
        });

        quizSubmit.classList.add('hidden');
        quizResult.classList.remove('hidden');

        var total = questions.length;
        if (correct === total) {
            quizScore.innerHTML = '<img src="../../icon/party-popper.svg" alt="" width="20" height="20" class="inline-icon"> Perfect! ' + correct + '/' + total;
            quizScore.style.color = 'var(--accent-green)';
        } else if (correct >= Math.ceil(total / 2)) {
            quizScore.innerHTML = '<img src="../../icon/correct.svg" alt="" width="20" height="20" class="inline-icon"> Good job! ' + correct + '/' + total;
            quizScore.style.color = 'var(--accent-amber)';
        } else {
            quizScore.innerHTML = '<img src="../../icon/books-svgrepo-com.svg" alt="" width="20" height="20" class="inline-icon"> Keep reading! ' + correct + '/' + total;
            quizScore.style.color = 'var(--accent-rose)';
        }

        // Gamification: bonus for quiz + record the reading
        if (!fromRestore && typeof Gamification !== 'undefined') {
            Gamification.addScore(correct);
            Gamification.recordActivity('english-quiz', correct);
            Gamification.recordActivity('english-read', 1);
        }

        saveResumeState();
    }

    // ── Helpers ──
    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    window.addEventListener('beforeunload', saveResumeState);

})();
