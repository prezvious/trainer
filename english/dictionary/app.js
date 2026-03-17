/**
 * English Dictionary - App
 * Fetches word definitions from the Free Dictionary API
 * and renders pronunciations, definitions, examples, synonyms, and antonyms.
 */
(function () {
    'use strict';

    var API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    var HISTORY_KEY = 'brainGymDictHistory';
    var HISTORY_MIGRATION_KEY = 'dictionary_history_localstorage_v1';
    var MAX_HISTORY = 20;
    var HISTORY_SAVE_DEBOUNCE_MS = 320;

    // DOM refs
    var searchInput = document.getElementById('search-input');
    var clearBtn = document.getElementById('clear-btn');
    var loader = document.getElementById('loader');
    var errorMsg = document.getElementById('error-msg');
    var errorText = document.getElementById('error-text');
    var resultsEl = document.getElementById('results');
    var historySection = document.getElementById('history-section');
    var historyList = document.getElementById('history-list');

    var debounceTimer = null;
    var currentWord = '';
    var historyCache = loadHistoryFromLocal();

    var historyCloud = {
        client: null,
        userId: null,
        saveTimer: null
    };
    var pendingReviewItemId = null;

    function toVocabReviewId(word) {
        if (window.BrainGymReviewQueue && typeof window.BrainGymReviewQueue.vocabId === 'function') {
            return window.BrainGymReviewQueue.vocabId(word);
        }
        return 'vocab:' + String(word || '').trim().toLowerCase();
    }

    function vocabReviewHref(word) {
        return 'english/dictionary/index.html?word=' + encodeURIComponent(word) +
            '&review=' + encodeURIComponent(toVocabReviewId(word));
    }

    function seedWordToReviewQueue(word) {
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.seed !== 'function') return;
        var safeWord = String(word || '').trim().toLowerCase();
        if (!safeWord) return;

        window.BrainGymReviewQueue.seed({
            id: toVocabReviewId(safeWord),
            type: 'vocab',
            title: safeWord,
            subtitle: 'English Dictionary',
            href: vocabReviewHref(safeWord)
        });
    }

    function markReviewedIfPending(word) {
        var safeWord = String(word || '').trim().toLowerCase();
        if (!safeWord || !pendingReviewItemId) return;
        if (pendingReviewItemId !== toVocabReviewId(safeWord)) return;
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.markReviewed !== 'function') return;

        window.BrainGymReviewQueue.markReviewed(pendingReviewItemId, 'good');
        pendingReviewItemId = null;
    }

    // Init
    renderHistory();
    historyCache.forEach(function (word) {
        seedWordToReviewQueue(word);
    });
    initHistoryCloudSync();
    initFromQueryParams();

    searchInput.addEventListener('input', function () {
        var val = searchInput.value.trim();
        clearBtn.classList.toggle('hidden', val.length === 0);

        clearTimeout(debounceTimer);
        if (val.length >= 2) {
            debounceTimer = setTimeout(function () {
                lookupWord(val);
            }, 600);
        }
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            var val = searchInput.value.trim();
            if (val.length >= 1) lookupWord(val);
        }
    });

    clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        resultsEl.innerHTML = '';
        errorMsg.classList.add('hidden');
        searchInput.focus();
    });

    var fetchGeneration = 0;

    function lookupWord(word) {
        word = word.toLowerCase().trim();
        if (word === currentWord) return;
        currentWord = word;

        var gen = ++fetchGeneration;

        showLoader();
        hideError();
        resultsEl.innerHTML = '';

        fetch(API_BASE + encodeURIComponent(word))
            .then(function (res) {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then(function (data) {
                if (gen !== fetchGeneration) return;
                hideLoader();
                if (!Array.isArray(data) || data.length === 0) {
                    showError('No definitions found for "' + word + '". Try a different word.');
                    return;
                }

                renderResults(data);
                addToHistory(word);
                renderHistory();
                markReviewedIfPending(word);

                if (typeof Gamification !== 'undefined') {
                    Gamification.recordActivity('english-dict', 1);
                }
            })
            .catch(function (err) {
                if (gen !== fetchGeneration) return;
                hideLoader();
                if (err.message === '404') {
                    showError('Word "' + word + '" not found. Check spelling or try another word.');
                } else {
                    showError('Network error. Please check your connection and try again.');
                }
            });
    }

    function initFromQueryParams() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var initialWord = (params.get('word') || '').trim().toLowerCase();
            pendingReviewItemId = (params.get('review') || '').trim() || null;
            if (!initialWord) return;

            searchInput.value = initialWord;
            clearBtn.classList.toggle('hidden', initialWord.length === 0);
            currentWord = '';
            lookupWord(initialWord);
        } catch (_) {
            // Ignore malformed query strings.
        }
    }

    function renderResults(data) {
        resultsEl.innerHTML = '';
        historySection.classList.add('hidden');

        data.forEach(function (wordEntry) {
            var word = wordEntry.word || '';
            var phoneticHtml = '';

            if (wordEntry.phonetics && wordEntry.phonetics.length > 0) {
                phoneticHtml += '<div class="pronunciation-list">';
                wordEntry.phonetics.forEach(function (p) {
                    if (!p.text) return;
                    phoneticHtml += '<span class="pron-chip">' + escHtml(p.text) + '</span>';
                });
                phoneticHtml += '</div>';
            }

            var meanings = wordEntry.meanings || [];
            meanings.forEach(function (meaning, idx) {
                var card = document.createElement('div');
                card.className = 'entry-card';
                card.style.animationDelay = (idx * 0.08) + 's';

                var html = '';
                html += '<div class="entry-header">';
                html += '<span class="entry-word">' + escHtml(word) + '</span>';
                if (meaning.partOfSpeech) {
                    html += '<span class="entry-pos">' + escHtml(meaning.partOfSpeech) + '</span>';
                }
                html += '</div>';

                html += phoneticHtml;

                if (meaning.definitions && meaning.definitions.length > 0) {
                    html += '<div class="sense-list">';
                    meaning.definitions.forEach(function (def, di) {
                        html += renderDefinition(def, di + 1);
                    });
                    html += '</div>';
                }

                var hasSyn = meaning.synonyms && meaning.synonyms.length > 0;
                var hasAnt = meaning.antonyms && meaning.antonyms.length > 0;
                if (hasSyn || hasAnt) {
                    html += '<div class="entry-relations">';
                    html += renderRelations(meaning.synonyms, meaning.antonyms);
                    html += '</div>';
                }

                card.innerHTML = html;

                card.querySelectorAll('.syn-chip, .ant-chip').forEach(function (chip) {
                    chip.addEventListener('click', function () {
                        var selectedWord = chip.textContent.trim();
                        searchInput.value = selectedWord;
                        clearBtn.classList.remove('hidden');
                        currentWord = '';
                        lookupWord(selectedWord);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                });

                resultsEl.appendChild(card);
            });
        });
    }

    function renderDefinition(def, num) {
        var html = '<div class="sense-item">';
        html += '<div class="sense-num">' + num + '</div>';
        html += '<div class="sense-def">' + escHtml(def.definition || '') + '</div>';

        if (def.example) {
            html += '<div class="example-list">';
            html += '<div class="example-item">"' + escHtml(def.example) + '"</div>';
            html += '</div>';
        }

        var hasSyn = def.synonyms && def.synonyms.length > 0;
        var hasAnt = def.antonyms && def.antonyms.length > 0;
        if (hasSyn || hasAnt) {
            html += renderRelations(def.synonyms, def.antonyms);
        }

        html += '</div>';
        return html;
    }

    function renderRelations(synonyms, antonyms) {
        var html = '<div class="word-relations">';
        if (synonyms && synonyms.length > 0) {
            html += '<div class="relation-group">';
            html += '<span class="relation-label">Syn</span>';
            synonyms.forEach(function (s) {
                html += '<button class="syn-chip">' + escHtml(s) + '</button>';
            });
            html += '</div>';
        }
        if (antonyms && antonyms.length > 0) {
            html += '<div class="relation-group">';
            html += '<span class="relation-label">Ant</span>';
            antonyms.forEach(function (a) {
                html += '<button class="ant-chip">' + escHtml(a) + '</button>';
            });
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    function loadHistoryFromLocal() {
        try {
            var raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter(function (entry) { return typeof entry === 'string' && entry.trim(); })
                .slice(0, MAX_HISTORY);
        } catch (_) {
            return [];
        }
    }

    function loadHistory() {
        return historyCache.slice();
    }

    function saveHistory(list) {
        historyCache = (Array.isArray(list) ? list : [])
            .filter(function (entry) { return typeof entry === 'string' && entry.trim(); })
            .slice(0, MAX_HISTORY);

        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache));
        } catch (_) {
            // Ignore local storage failures.
        }

        queueCloudHistorySave();
    }

    function addToHistory(word) {
        var list = loadHistory();
        list = list.filter(function (w) { return w !== word; });
        list.unshift(word);
        if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
        saveHistory(list);
        seedWordToReviewQueue(word);
    }

    function renderHistory() {
        var list = loadHistory();
        if (list.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyList.innerHTML = '';

        list.forEach(function (word) {
            var chip = document.createElement('button');
            chip.className = 'history-chip';
            chip.textContent = word;
            chip.addEventListener('click', function () {
                searchInput.value = word;
                clearBtn.classList.remove('hidden');
                currentWord = '';
                lookupWord(word);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            historyList.appendChild(chip);
        });
    }

    function queueCloudHistorySave() {
        if (!historyCloud.client || !historyCloud.userId) return;
        if (historyCloud.saveTimer) window.clearTimeout(historyCloud.saveTimer);
        historyCloud.saveTimer = window.setTimeout(function () {
            syncHistoryToCloud().catch(function (error) {
                console.error('Failed to sync dictionary history:', error);
            });
        }, HISTORY_SAVE_DEBOUNCE_MS);
    }

    function buildHistoryRows() {
        var now = Date.now();
        return historyCache.map(function (word, index) {
            return {
                user_id: historyCloud.userId,
                word: word,
                last_searched_at: new Date(now - (index * 1000)).toISOString(),
                search_count: Math.max(1, MAX_HISTORY - index)
            };
        });
    }

    async function syncHistoryToCloud() {
        if (!historyCloud.client || !historyCloud.userId) return;

        var existingResponse = await historyCloud.client
            .from('user_dictionary_history')
            .select('word')
            .eq('user_id', historyCloud.userId);
        if (existingResponse.error) throw existingResponse.error;

        var rows = buildHistoryRows();
        var upsertedWords = {};
        if (rows.length > 0) {
            rows.forEach(function (row) {
                upsertedWords[row.word] = true;
            });
            var upsertResponse = await historyCloud.client
                .from('user_dictionary_history')
                .upsert(rows, { onConflict: 'user_id,word' });
            if (upsertResponse.error) throw upsertResponse.error;
        }

        var staleWords = (existingResponse.data || [])
            .map(function (row) { return row.word; })
            .filter(function (word) { return !upsertedWords[word]; });

        if (staleWords.length > 0) {
            var staleDeleteResponse = await historyCloud.client
                .from('user_dictionary_history')
                .delete()
                .eq('user_id', historyCloud.userId)
                .in('word', staleWords);
            if (staleDeleteResponse.error) throw staleDeleteResponse.error;
        }
    }

    async function hasHistoryMigrationMark() {
        var response = await historyCloud.client
            .from('user_migrations')
            .select('migration_key')
            .eq('user_id', historyCloud.userId)
            .eq('migration_key', HISTORY_MIGRATION_KEY)
            .maybeSingle();

        if (response.error && response.error.code !== 'PGRST116') {
            throw response.error;
        }
        return Boolean(response.data);
    }

    async function setHistoryMigrationMark() {
        var response = await historyCloud.client
            .from('user_migrations')
            .upsert({
                user_id: historyCloud.userId,
                migration_key: HISTORY_MIGRATION_KEY,
                metadata: { source: 'localStorage', at: new Date().toISOString() }
            }, { onConflict: 'user_id,migration_key' });
        if (response.error) throw response.error;
    }

    async function migrateLocalHistoryIfNeeded() {
        var alreadyMigrated = await hasHistoryMigrationMark();
        if (alreadyMigrated) return;

        if (historyCache.length > 0) {
            await syncHistoryToCloud();
        }
        await setHistoryMigrationMark();
    }

    async function hydrateHistoryFromCloud() {
        var response = await historyCloud.client
            .from('user_dictionary_history')
            .select('word')
            .order('last_searched_at', { ascending: false })
            .limit(MAX_HISTORY);

        if (response.error) throw response.error;

        var remoteList = (response.data || [])
            .map(function (row) { return row.word; })
            .filter(function (word) { return typeof word === 'string' && word.trim(); });

        if (remoteList.length === 0) return;

        saveHistory(remoteList);
        renderHistory();
    }

    async function initHistoryCloudSync() {
        if (!window.BrainGymAuth || !window.BrainGymAuth.ready) return;

        try {
            var auth = await window.BrainGymAuth.ready;
            if (!auth || !auth.client || !auth.user) return;

            historyCloud.client = auth.client;
            historyCloud.userId = auth.user.id;

            await migrateLocalHistoryIfNeeded();
            await hydrateHistoryFromCloud();
        } catch (error) {
            console.error('Dictionary history cloud sync failed:', error);
        }
    }

    function showLoader() {
        loader.classList.remove('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function hideError() {
        errorMsg.classList.add('hidden');
    }

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Expose for pop-up dictionary reuse
    window.DictionaryLookup = lookupWord;
})();
