/**
 * Grammar Flashcards â€” App
 * Level-based grammar content from A1 to C1, displayed as interactive flashcards.
 */
(function () {
    'use strict';

    // ================================================================
    // GRAMMAR DATA â€” A1 to C1
    // Each item: { id, topic, level, explanation, example, tip }
    // ================================================================

    var GRAMMAR_DATA = [
        // â”€â”€ A1 â€” Beginner â”€â”€
        {
            id: 'a1-01', level: 'A1', topic: 'Present Simple â€” Affirmative',
            explanation: 'Use the present simple to talk about habits, routines, and general truths. Add <strong>-s / -es</strong> for he/she/it.',
            example: ' She <strong>plays</strong> tennis every Saturday.\n Water <strong>boils</strong> at 100Â°C.',
            tip: 'Third person singular (he/she/it) always takes -s: "He works", NOT "He work".'
        },
        {
            id: 'a1-02', level: 'A1', topic: 'Present Simple â€” Negative & Questions',
            explanation: 'Use <strong>do/does + not</strong> for negatives. Use <strong>Do/Does + subject</strong> for questions. The main verb stays in base form.',
            example: ' She <strong>doesn\'t like</strong> coffee.\n <strong>Do</strong> you <strong>speak</strong> English?',
            tip: 'After "does/doesn\'t", use the base verb: "Does she likeâ€¦" (NOT "Does she likesâ€¦").'
        },
        {
            id: 'a1-03', level: 'A1', topic: 'Articles: A, An, The',
            explanation: '<strong>A/An</strong> = indefinite (one, any, first mention). <strong>The</strong> = definite (specific, already known). Use <strong>an</strong> before vowel sounds.',
            example: ' I saw <strong>a</strong> cat. <strong>The</strong> cat was black.\n She is <strong>an</strong> engineer.',
            tip: 'It\'s about the SOUND, not the letter: "a university" (starts with /juË/) but "an hour" (silent h).'
        },
        {
            id: 'a1-04', level: 'A1', topic: 'Subject Pronouns & To Be',
            explanation: 'Subject pronouns: <strong>I, you, he, she, it, we, they</strong>. Pair with correct form of "be": am, is, are.',
            example: ' <strong>I am</strong> a student. <strong>She is</strong> happy. <strong>They are</strong> friends.',
            tip: 'Contractions: I\'m, you\'re, he\'s, she\'s, it\'s, we\'re, they\'re.'
        },
        {
            id: 'a1-05', level: 'A1', topic: 'Basic Prepositions of Place',
            explanation: '<strong>In</strong> = inside a space. <strong>On</strong> = on a surface. <strong>At</strong> = a specific point or location.',
            example: ' The book is <strong>on</strong> the table.\n She lives <strong>in</strong> Jakarta.\n Meet me <strong>at</strong> the station.',
            tip: 'Remember: IN a city/country, ON a street, AT an address.'
        },
        {
            id: 'a1-06', level: 'A1', topic: 'Singular and Plural Nouns',
            explanation: 'Most nouns: add <strong>-s</strong>. Words ending in -s, -sh, -ch, -x, -z: add <strong>-es</strong>. Some are irregular (child â†’ children).',
            example: ' book â†’ <strong>books</strong>, box â†’ <strong>boxes</strong>\n man â†’ <strong>men</strong>, tooth â†’ <strong>teeth</strong>',
            tip: 'Watch out for irregular plurals: person â†’ people, mouse â†’ mice, foot â†’ feet.'
        },
        {
            id: 'a1-07', level: 'A1', topic: 'Present Continuous',
            explanation: 'Use <strong>am/is/are + verb-ing</strong> for actions happening right now or temporary situations.',
            example: ' She <strong>is reading</strong> a book right now.\n They <strong>are playing</strong> football.',
            tip: 'Spelling: drop the final -e before adding -ing (make â†’ making). Double consonants (sit â†’ sitting).'
        },
        {
            id: 'a1-08', level: 'A1', topic: 'Basic Conjunctions: And, But, Or',
            explanation: '<strong>And</strong> = addition. <strong>But</strong> = contrast. <strong>Or</strong> = choice/alternative.',
            example: ' I like tea <strong>and</strong> coffee.\n She is smart <strong>but</strong> lazy.\n Do you want tea <strong>or</strong> coffee?',
            tip: 'Use a comma before these conjunctions when joining two full sentences.'
        },

        // â”€â”€ A2 â€” Elementary â”€â”€
        {
            id: 'a2-01', level: 'A2', topic: 'Past Simple â€” Regular Verbs',
            explanation: 'Add <strong>-ed</strong> to the base verb for regular past tense. Use <strong>did + base verb</strong> for questions and negatives.',
            example: ' I <strong>walked</strong> to school yesterday.\n She <strong>didn\'t watch</strong> the movie.\n <strong>Did</strong> you <strong>finish</strong>?',
            tip: 'Pronunciation of -ed: /t/ after voiceless sounds (walked), /d/ after voiced (played), /Éªd/ after t/d (wanted).'
        },
        {
            id: 'a2-02', level: 'A2', topic: 'Past Simple â€” Irregular Verbs',
            explanation: 'Many common verbs have irregular past forms that must be memorized. They don\'t follow the -ed pattern.',
            example: ' go â†’ <strong>went</strong>, see â†’ <strong>saw</strong>, eat â†’ <strong>ate</strong>\n I <strong>went</strong> to the park. She <strong>saw</strong> a bird.',
            tip: 'Learn the top 50 irregular verbs by heart â€” they cover 90% of everyday conversation.'
        },
        {
            id: 'a2-03', level: 'A2', topic: 'Comparatives & Superlatives',
            explanation: 'Short adjectives: add <strong>-er / -est</strong>. Long adjectives: use <strong>more / most</strong>. Irregular: good â†’ better â†’ best.',
            example: ' She is <strong>taller than</strong> her brother.\n This is the <strong>most interesting</strong> book.\n He is <strong>better</strong> at math.',
            tip: '2-syllable adjectives ending in -y use -ier/-iest: happy â†’ happier â†’ happiest.'
        },
        {
            id: 'a2-04', level: 'A2', topic: 'Modal Verbs: Can, Must, Should',
            explanation: '<strong>Can</strong> = ability/permission. <strong>Must</strong> = obligation/strong necessity. <strong>Should</strong> = advice/recommendation.',
            example: ' I <strong>can</strong> swim. You <strong>must</strong> wear a seatbelt.\n You <strong>should</strong> see a doctor.',
            tip: 'After modal verbs, always use the BASE form: "She can swim" (NOT "She can swims").'
        },
        {
            id: 'a2-05', level: 'A2', topic: 'Countable & Uncountable Nouns',
            explanation: '<strong>Countable</strong>: can be counted (a book, two books). <strong>Uncountable</strong>: cannot be counted (water, advice). Use <strong>much/little</strong> with uncountable, <strong>many/few</strong> with countable.',
            example: ' How <strong>many</strong> chairs do you need?\n How <strong>much</strong> water do you want?',
            tip: 'Some nouns can be both: "I had two coffees" (= cups of coffee) vs. "I like coffee" (the substance).'
        },
        {
            id: 'a2-06', level: 'A2', topic: 'Present Perfect â€” Introduction',
            explanation: 'Use <strong>have/has + past participle</strong> for experiences, or actions with a result in the present. Time is not specified.',
            example: ' I <strong>have visited</strong> Paris. (experience)\n She <strong>has lost</strong> her keys. (present result)',
            tip: 'Use "ever" for questions and "never" for negatives: "Have you ever been to Japan?"'
        },
        {
            id: 'a2-07', level: 'A2', topic: 'Going To â€” Future Plans',
            explanation: 'Use <strong>am/is/are + going to + base verb</strong> for planned intentions and predictions based on evidence.',
            example: ' I <strong>am going to</strong> study medicine.\n Look at those clouds â€” it <strong>is going to</strong> rain.',
            tip: '"Going to" = planned decision. "Will" = spontaneous decision ("I\'ll help you").'
        },
        {
            id: 'a2-08', level: 'A2', topic: 'Adverbs of Frequency',
            explanation: 'Words like <strong>always, usually, often, sometimes, rarely, never</strong> go BEFORE the main verb but AFTER "be".',
            example: ' She <strong>always</strong> wakes up early.\n He <strong>is usually</strong> late.',
            tip: 'Order of frequency: always (100%) â†’ usually â†’ often â†’ sometimes â†’ rarely â†’ never (0%).'
        },

        // â”€â”€ B1 â€” Intermediate â”€â”€
        {
            id: 'b1-01', level: 'B1', topic: 'Present Perfect vs Past Simple',
            explanation: '<strong>Present Perfect</strong>: no specific time, or action connected to now. <strong>Past Simple</strong>: finished action at a specific time.',
            example: ' I <strong>have been</strong> to London. (unspecified when)\n I <strong>went</strong> to London <strong>last year</strong>. (specified)',
            tip: 'Time markers: "yesterday, in 2020, ago" â†’ Past Simple. "Already, yet, just, ever" â†’ Present Perfect.'
        },
        {
            id: 'b1-02', level: 'B1', topic: 'First Conditional',
            explanation: '<strong>If + present simple, will + base verb.</strong> Used for real/possible future situations.',
            example: ' <strong>If</strong> it <strong>rains</strong>, I <strong>will take</strong> an umbrella.\n <strong>If</strong> you <strong>study</strong> hard, you <strong>will pass</strong>.',
            tip: 'Don\'t use "will" in the if-clause: "If it rainsâ€¦" (NOT "If it will rainâ€¦").'
        },
        {
            id: 'b1-03', level: 'B1', topic: 'Second Conditional',
            explanation: '<strong>If + past simple, would + base verb.</strong> Used for unreal/hypothetical present or future situations.',
            example: ' <strong>If</strong> I <strong>had</strong> a million dollars, I <strong>would travel</strong> the world.\n <strong>If</strong> I <strong>were</strong> you, I <strong>would apologize</strong>.',
            tip: 'Formally, use "were" for all subjects: "If I wereâ€¦" "If she wereâ€¦" (subjunctive).'
        },
        {
            id: 'b1-04', level: 'B1', topic: 'Passive Voice â€” Present & Past',
            explanation: 'Form: <strong>be + past participle</strong>. Use when the action is more important than who does it.',
            example: ' Active: They <strong>built</strong> the bridge.\n Passive: The bridge <strong>was built</strong> (by them).',
            tip: 'Use "by" only when the agent (doer) is important or surprising.'
        },
        {
            id: 'b1-05', level: 'B1', topic: 'Relative Clauses (Who, Which, That)',
            explanation: '<strong>Who</strong> = people. <strong>Which</strong> = things. <strong>That</strong> = people or things (informal). They add information to a noun.',
            example: ' The man <strong>who lives</strong> next door is a doctor.\n The book <strong>that I bought</strong> is interesting.',
            tip: 'In defining clauses, "that" can replace "who/which". In non-defining (with commas), use "who/which" only.'
        },
        {
            id: 'b1-06', level: 'B1', topic: 'Reported Speech â€” Statements',
            explanation: 'When reporting what someone said, shift the tense back: present â†’ past, past â†’ past perfect, will â†’ would.',
            example: ' Direct: "I <strong>am</strong> tired."\n Reported: She said she <strong>was</strong> tired.',
            tip: 'Also shift: this â†’ that, here â†’ there, today â†’ that day, tomorrow â†’ the next day.'
        },
        {
            id: 'b1-07', level: 'B1', topic: 'Used To + Infinitive',
            explanation: 'Use <strong>used to + base verb</strong> for past habits or states that are no longer true.',
            example: ' I <strong>used to</strong> play football. (I don\'t anymore.)\n She <strong>used to</strong> live in Paris.',
            tip: 'Don\'t confuse with "be used to + -ing" (= be accustomed to): "I\'m used to waking up early."'
        },
        {
            id: 'b1-08', level: 'B1', topic: 'Modal Verbs: May, Might, Could',
            explanation: '<strong>May/Might/Could</strong> = possibility. May is slightly more likely than might. Could also means past ability.',
            example: ' It <strong>may/might</strong> rain later.\n She <strong>could</strong> be at home.',
            tip: '"May" is also used for formal permission: "May I come in?"'
        },

        // â”€â”€ B2 â€” Upper-Intermediate â”€â”€
        {
            id: 'b2-01', level: 'B2', topic: 'Third Conditional',
            explanation: '<strong>If + past perfect, would have + past participle.</strong> Used for unreal past situations â€” things that didn\'t happen.',
            example: ' <strong>If</strong> I <strong>had studied</strong> harder, I <strong>would have passed</strong>.',
            tip: 'Contractions: "If I\'d known, I\'d have helped." Common in spoken English.'
        },
        {
            id: 'b2-02', level: 'B2', topic: 'Wish & If Only',
            explanation: '<strong>Wish/If only + past simple</strong> = regret about the present. <strong>Wish/If only + past perfect</strong> = regret about the past.',
            example: ' I <strong>wish I had</strong> more time. (present)\n <strong>If only</strong> I <strong>had listened</strong> to you. (past)',
            tip: '"Wish + would" = annoyance about something that won\'t change: "I wish you would stop talking."'
        },
        {
            id: 'b2-03', level: 'B2', topic: 'Advanced Passive â€” Other Tenses',
            explanation: 'Passive works in all tenses: <strong>is being done</strong> (present continuous), <strong>has been done</strong> (present perfect), <strong>will be done</strong> (future).',
            example: ' The report <strong>is being written</strong> now.\n The work <strong>has been completed</strong>.',
            tip: 'With modals: "It must be done." "It should have been finished."'
        },
        {
            id: 'b2-04', level: 'B2', topic: 'Participle Clauses',
            explanation: 'Use <strong>-ing</strong> (present participle) or <strong>-ed</strong> (past participle) clauses to replace relative or adverbial clauses for conciseness.',
            example: ' <strong>Walking</strong> home, I saw a fox. (= While I was walkingâ€¦)\n <strong>Built</strong> in 1900, the house is historical. (= The house, which was builtâ€¦)',
            tip: 'The participle clause and the main clause must share the same subject, otherwise it\'s a dangling modifier.'
        },
        {
            id: 'b2-05', level: 'B2', topic: 'Inversion for Emphasis',
            explanation: 'After negative/restrictive adverbs at the start, invert subject and auxiliary: <strong>Never have Iâ€¦, Not only did sheâ€¦, Rarely does heâ€¦</strong>',
            example: ' <strong>Never have</strong> I seen such beauty.\n <strong>Not only did</strong> she win, but she broke the record.',
            tip: 'Common triggers: never, rarely, seldom, hardly, not only, no sooner, little.'
        },
        {
            id: 'b2-06', level: 'B2', topic: 'Causative: Have/Get Something Done',
            explanation: '<strong>Have + object + past participle</strong> = arrange for someone else to do something. <strong>Get</strong> is more informal.',
            example: ' I <strong>had my car repaired</strong>. (Someone repaired it for me.)\n She <strong>got her hair cut</strong>.',
            tip: 'Different from "I repaired my car" (= I did it myself).'
        },
        {
            id: 'b2-07', level: 'B2', topic: 'Future Perfect & Future Continuous',
            explanation: '<strong>Will have + past participle</strong> = completed before a future time. <strong>Will be + -ing</strong> = in progress at a future time.',
            example: ' By 2030, I <strong>will have graduated</strong>.\n At 8 PM, I <strong>will be studying</strong>.',
            tip: 'Future Perfect often pairs with "by + time": "By next month, they will have finished."'
        },
        {
            id: 'b2-08', level: 'B2', topic: 'Linking Words: Despite, Although, However',
            explanation: '<strong>Although/Though + clause.</strong> <strong>Despite/In spite of + noun/-ing.</strong> <strong>However</strong> = sentence connector (+ comma).',
            example: ' <strong>Although</strong> it rained, we went out.\n <strong>Despite</strong> the rain, we went out.\n It rained. <strong>However</strong>, we went out.',
            tip: '"Despite" and "in spite of" are NEVER followed by a clause directly â€” use "the fact that" to bridge.'
        },

        // â”€â”€ C1 â€” Advanced â”€â”€
        {
            id: 'c1-01', level: 'C1', topic: 'Cleft Sentences',
            explanation: 'Use <strong>It is/wasâ€¦ that/who</strong> to emphasize a particular part of a sentence.',
            example: ' Normal: John broke the window.\n Cleft: <strong>It was John who</strong> broke the window.\n Cleft: <strong>It was the window that</strong> John broke.',
            tip: '"What" cleft: "What I need is a vacation." Emphasizes the whole idea.'
        },
        {
            id: 'c1-02', level: 'C1', topic: 'Mixed Conditionals',
            explanation: 'Mix 2nd and 3rd conditionals when cause and effect span different time frames.<br><strong>Past cause â†’ present result:</strong> If + past perfect, would + base.<br><strong>Present cause â†’ past result:</strong> If + past simple, would have + p.p.',
            example: ' <strong>If</strong> I <strong>had accepted</strong> the job, I <strong>would be</strong> rich now. (past â†’ present)\n <strong>If</strong> she <strong>were</strong> braver, she <strong>would have spoken</strong> up. (present â†’ past)',
            tip: 'The key is identifying which timeframe belongs to the condition and which to the result.'
        },
        {
            id: 'c1-03', level: 'C1', topic: 'Subjunctive Mood',
            explanation: 'Use the base form of the verb after verbs of demand, suggestion, or necessity: <strong>insist, suggest, recommend, demand, require</strong>.',
            example: ' I <strong>suggest</strong> that he <strong>be</strong> more careful. (NOT "is")\n They <strong>demanded</strong> that she <strong>leave</strong> immediately.',
            tip: 'More common in formal/written English. In spoken British English, "should + base" is often used instead.'
        },
        {
            id: 'c1-04', level: 'C1', topic: 'Advanced Inversion Patterns',
            explanation: 'Beyond negative adverbs: <strong>So + adjective</strong>, <strong>Such + be</strong>, <strong>Had + subject</strong> (= Ifâ€¦ had), <strong>Were + subject</strong> (= Ifâ€¦ were).',
            example: ' <strong>So great was</strong> the damage that repairs took months.\n <strong>Had I known</strong>, I would have helped. (= If I had knownâ€¦)\n <strong>Were she</strong> here, she would agree.',
            tip: 'Formal inversion can replace "if" in conditionals: "Had he arrivedâ€¦" = "If he had arrivedâ€¦"'
        },
        {
            id: 'c1-05', level: 'C1', topic: 'Discourse Markers',
            explanation: 'Words/phrases that organize spoken & written text: <strong>furthermore, nevertheless, consequently, on the other hand, in other words, as a matter of fact</strong>.',
            example: ' The plan failed. <strong>Nevertheless</strong>, we learned a lot.\n <strong>Furthermore</strong>, the data supports our hypothesis.',
            tip: 'Match the register: "furthermore/consequently" in essays; "anyway/so/basically" in conversation.'
        },
        {
            id: 'c1-06', level: 'C1', topic: 'Nominalization',
            explanation: 'Convert verbs/adjectives into nouns to make writing more formal and academic: <strong>decide â†’ decision, important â†’ importance, develop â†’ development</strong>.',
            example: ' Informal: We <strong>decided</strong> to invest.\n Formal: A <strong>decision</strong> was made to invest.',
            tip: 'Common suffixes: -tion, -ment, -ness, -ity, -ance/-ence. Overuse makes writing too dense.'
        },
        {
            id: 'c1-07', level: 'C1', topic: 'Emphasis with Do/Does/Did',
            explanation: 'Use <strong>do/does/did + base verb</strong> in affirmative sentences for emphasis or contrast.',
            example: ' I <strong>do</strong> understand your point.\n She <strong>did</strong> finish the report, despite what he said.',
            tip: 'Often used in contradictions: "You didn\'t help." â†’ "I DID help!"'
        },
        {
            id: 'c1-08', level: 'C1', topic: 'Ellipsis and Substitution',
            explanation: 'Avoid repetition by omitting words (<strong>ellipsis</strong>) or replacing them with <strong>so, do, one, not</strong> (<strong>substitution</strong>).',
            example: ' "Can you help?" â€” "I\'d like to ___." (ellipsis: "help" omitted)\n "Is she coming?" â€” "I think <strong>so</strong>." (substitution)',
            tip: '"I hope so / I don\'t think so / I\'m afraid not" â€” learn these as fixed phrases.'
        }
    ];

    // ================================================================
    // LEVEL METADATA
    // ================================================================

    var LEVELS = [
        { code: 'A1', name: 'Beginner', desc: 'Essential grammar foundations' },
        { code: 'A2', name: 'Elementary', desc: 'Expanding basic structures' },
        { code: 'B1', name: 'Intermediate', desc: 'Core grammar for communication' },
        { code: 'B2', name: 'Upper-Intermediate', desc: 'Complex structures & nuance' },
        { code: 'C1', name: 'Advanced', desc: 'Academic & formal precision' }
    ];

    // ================================================================
    // STATE
    // ================================================================

    var MODULE_STATE_KEY = 'english-grammar';
    var currentLevel = null;
    var currentCards = [];
    var currentIndex = 0;
    var isFlipped = false;
    var pendingReviewItemId = null;

    // DOM refs
    var levelView = document.getElementById('level-view');
    var fcView = document.getElementById('flashcard-view');
    var levelGrid = document.getElementById('level-grid');
    var backBtn = document.getElementById('back-to-levels');
    var fcLevelBadge = document.getElementById('fc-level-badge');
    var fcCounter = document.getElementById('fc-counter');
    var fcProgressFill = document.getElementById('fc-progress-fill');
    var flashcard = document.getElementById('flashcard');
    var fcTopic = document.getElementById('fc-topic');
    var fcExplanation = document.getElementById('fc-explanation');
    var fcExample = document.getElementById('fc-example');
    var fcTip = document.getElementById('fc-tip');
    var fcPrev = document.getElementById('fc-prev');
    var fcNext = document.getElementById('fc-next');
    var fcFlip = document.getElementById('fc-flip');
    var fcShuffle = document.getElementById('fc-shuffle');

    function toGrammarReviewId(cardId) {
        if (window.BrainGymReviewQueue && typeof window.BrainGymReviewQueue.grammarId === 'function') {
            return window.BrainGymReviewQueue.grammarId(cardId);
        }
        return 'grammar:' + String(cardId || '').trim().toLowerCase();
    }

    function grammarReviewHref(card) {
        return 'english/grammar/index.html?level=' + encodeURIComponent(card.level) +
            '&card=' + encodeURIComponent(card.id) +
            '&review=' + encodeURIComponent(toGrammarReviewId(card.id));
    }

    function getCurrentCard() {
        if (!currentCards || currentCards.length === 0) return null;
        if (currentIndex < 0 || currentIndex >= currentCards.length) return null;
        return currentCards[currentIndex];
    }

    function seedCurrentCardToQueue() {
        var card = getCurrentCard();
        if (!card) return;
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.seed !== 'function') return;

        window.BrainGymReviewQueue.seed({
            id: toGrammarReviewId(card.id),
            type: 'grammar',
            title: card.topic,
            subtitle: card.level + ' Grammar',
            href: grammarReviewHref(card)
        });
    }

    function markCurrentCardReviewed() {
        var card = getCurrentCard();
        if (!card) return;
        if (!window.BrainGymReviewQueue || typeof window.BrainGymReviewQueue.markReviewed !== 'function') return;
        window.BrainGymReviewQueue.markReviewed(toGrammarReviewId(card.id), 'good');
    }

    function saveResumeState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.save !== 'function') return;
        var card = getCurrentCard();
        window.BrainGymModuleState.save(MODULE_STATE_KEY, {
            level: currentLevel,
            index: currentIndex,
            cardId: card ? card.id : null,
            inFlashcardView: !fcView.classList.contains('hidden'),
            isFlipped: isFlipped
        });
    }

    function loadResumeState() {
        if (!window.BrainGymModuleState || typeof window.BrainGymModuleState.load !== 'function') return null;
        return window.BrainGymModuleState.load(MODULE_STATE_KEY, null);
    }

    function resolveCardIndex(level, preferredCardId, fallbackIndex) {
        var cards = GRAMMAR_DATA.filter(function (g) { return g.level === level; });
        if (cards.length === 0) return 0;

        if (preferredCardId) {
            var byId = cards.findIndex(function (card) { return card.id === preferredCardId; });
            if (byId >= 0) return byId;
        }

        var index = Number(fallbackIndex);
        if (!Number.isFinite(index)) return 0;
        index = Math.floor(index);
        if (index < 0) return 0;
        if (index >= cards.length) return cards.length - 1;
        return index;
    }

    function parseLaunchTarget() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            return {
                level: (params.get('level') || '').trim().toUpperCase() || null,
                cardId: (params.get('card') || '').trim().toLowerCase() || null,
                reviewId: (params.get('review') || '').trim() || null
            };
        } catch (_) {
            return { level: null, cardId: null, reviewId: null };
        }
    }

    function applyInitialState() {
        var launch = parseLaunchTarget();
        if (launch.reviewId) pendingReviewItemId = launch.reviewId;

        if (launch.level) {
            openLevel(launch.level, resolveCardIndex(launch.level, launch.cardId, 0));
            return;
        }

        var saved = loadResumeState();
        if (!saved || !saved.level || !saved.inFlashcardView) return;

        var restoredIndex = resolveCardIndex(saved.level, saved.cardId, saved.index);
        openLevel(saved.level, restoredIndex);

        if (saved.isFlipped) {
            isFlipped = true;
            flashcard.classList.add('flipped');
        }
    }

    function renderLevelGrid() {
        levelGrid.innerHTML = '';
        LEVELS.forEach(function (lvl) {
            var count = GRAMMAR_DATA.filter(function (g) { return g.level === lvl.code; }).length;
            var card = document.createElement('div');
            card.className = 'level-card';
            card.dataset.level = lvl.code;
            card.innerHTML =
                '<div class="level-badge">' + lvl.code + '</div>' +
                '<div class="level-name">' + lvl.name + '</div>' +
                '<div class="level-count">' + count + ' cards</div>';
            card.addEventListener('click', function () { openLevel(lvl.code, 0); });
            levelGrid.appendChild(card);
        });
    }

    function openLevel(level, startIndex) {
        currentLevel = level;
        currentCards = GRAMMAR_DATA.filter(function (g) { return g.level === level; });
        currentIndex = resolveCardIndex(level, null, startIndex);
        isFlipped = false;

        levelView.classList.add('hidden');
        fcView.classList.remove('hidden');
        fcLevelBadge.textContent = level;

        renderCard();
    }

    function renderCard() {
        if (currentCards.length === 0) return;

        var card = currentCards[currentIndex];
        fcTopic.textContent = card.topic;
        fcExplanation.innerHTML = card.explanation;
        fcExample.innerHTML = card.example.replace(/\n/g, '<br>');
        fcTip.innerHTML = '<img src="../../icon/light-bulb.svg" alt="" width="16" height="16" class="inline-icon"> ' + card.tip;

        fcCounter.textContent = (currentIndex + 1) + ' / ' + currentCards.length;
        fcProgressFill.style.width = ((currentIndex + 1) / currentCards.length * 100) + '%';

        isFlipped = false;
        flashcard.classList.remove('flipped');

        seedCurrentCardToQueue();
        if (pendingReviewItemId && pendingReviewItemId === toGrammarReviewId(card.id) &&
            window.BrainGymReviewQueue &&
            typeof window.BrainGymReviewQueue.markReviewed === 'function') {
            window.BrainGymReviewQueue.markReviewed(pendingReviewItemId, 'good');
            pendingReviewItemId = null;
        }

        saveResumeState();
    }

    function navigate(dir) {
        currentIndex += dir;
        if (currentIndex < 0) currentIndex = currentCards.length - 1;
        if (currentIndex >= currentCards.length) currentIndex = 0;
        renderCard();

        if (typeof Gamification !== 'undefined') {
            Gamification.recordActivity('english-grammar', 1);
        }

        saveResumeState();
    }

    function toggleFlip() {
        isFlipped = !isFlipped;
        flashcard.classList.toggle('flipped', isFlipped);
        if (isFlipped) {
            markCurrentCardReviewed();
        }
        saveResumeState();
    }

    function shuffleCards() {
        for (var i = currentCards.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = currentCards[i];
            currentCards[i] = currentCards[j];
            currentCards[j] = temp;
        }
        currentIndex = 0;
        renderCard();
        saveResumeState();
    }

    // Init
    renderLevelGrid();
    applyInitialState();

    backBtn.addEventListener('click', function () {
        fcView.classList.add('hidden');
        levelView.classList.remove('hidden');
        saveResumeState();
    });

    flashcard.addEventListener('click', function () { toggleFlip(); });
    fcFlip.addEventListener('click', function () { toggleFlip(); });
    fcPrev.addEventListener('click', function () { navigate(-1); });
    fcNext.addEventListener('click', function () { navigate(1); });
    fcShuffle.addEventListener('click', function () { shuffleCards(); });
    window.addEventListener('beforeunload', saveResumeState);

})();
