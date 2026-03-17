# Brain Gym (Trainer v2)

Brain Gym is a multi-module learning website for daily mental training.  
It combines fast math practice, formula revision, geometry visualization, English literacy tools, and Bahasa Indonesia drills in one place.

The project is a static frontend app (HTML/CSS/JavaScript) with:
- Supabase Auth for sign in/sign up
- Supabase database sync for user progress and history
- localStorage fallback for offline/local caching

## Main Features

### 1. Home Dashboard
- Hero section and module launcher cards
- Progress snapshot with:
  - day streak
  - total score
  - today activity count
- 7-day activity chart
- Animated counters and visual effects (respecting reduced-motion settings)

Files:
- `index.html`
- `app.js`
- `gamification.js`

### 2. Math Trainer
Interactive practice app with many modes:
- Addition
- Subtraction
- Multiplication
- Division (with difficulty levels)
- Mixed mode (custom difficulty per operation)
- Chain Math (Flash Anzan style)
- PEMDAS
- Square and Square Root
- GCF and LCM
- Number Pattern
- Comparison (ratio/context problems)

Math Trainer also includes:
- Time modes: 10s, 30s, unlimited
- Session stats (accuracy, average time, best time, combo multiplier)
- Analytics (7-day chart, Ao5, Ao12, operation-level stats)
- History tabs (sessions + wrong answers)
- Settings (digit range, chain length, theme)
- Data management (clear all data)
- Reference tools:
  - power table (x^n)
  - multiplication table (1-40)
  - algebra formulas
  - prime numbers table
- Active-session autosave and resume support

Files:
- `math-trainer/index.html`
- `math-trainer/app.js`
- `math-trainer/persistence.js`

### 3. Formula Notes
- Grid view of formula categories
- Search in category names, descriptions, and formula labels
- Two-panel detail view (sidebar + content)
- KaTeX rendering for formulas
- Favorite formulas (`SAVE` / `SAVED`)
- Favorite sync to Supabase (`user_formula_favorites`)

Files:
- `formula-notes/index.html`
- `formula-notes/app.js`

### 4. Geometry Visualizer
- 2D shape explorer with SVG diagrams and formulas
- 3D shape explorer using Three.js + OrbitControls
- Misc formula section grouped by topic
- Language toggle: English / Indonesian
- KaTeX-rendered formulas

Files:
- `geometry/index.html`
- `geometry/app.js`

### 5. English Module
Module launcher:
- Dictionary
- Grammar Flashcards
- Daily Read

Files:
- `english/index.html`

#### English Dictionary
- Word lookup using Free Dictionary API (`dictionaryapi.dev`)
- Pronunciation chips, meanings, examples
- Synonym/antonym chips (click to search)
- Query-param support (`?word=...`)
- Recent search history (local + cloud sync)

Files:
- `english/dictionary/index.html`
- `english/dictionary/app.js`

#### Grammar Flashcards
- CEFR levels A1 to C1
- Level cards, flashcard flip, next/prev navigation
- Shuffle mode and progress bar

Files:
- `english/grammar/index.html`
- `english/grammar/app.js`

#### Daily Read
- Article of the day based on weekday mapping
- Multiple article rotation by week number
- Click any word for popup dictionary
- Reading comprehension quiz with scoring

Files:
- `english/daily-read/index.html`
- `english/daily-read/app.js`
- `english/daily-read/articles.js`

### 6. Bahasa Indonesia Module
Module launcher:
- Kata Baku
- Analogi

Files:
- `indonesian/index.html`

#### Kata Baku
- Swipe flashcards: right = baku, left = tidak baku
- Input methods:
  - touch swipe
  - keyboard arrows
  - button clicks
- Session score, streak, and end summary

Files:
- `indonesian/kata-baku/index.html`
- `indonesian/kata-baku/app.js`
- `indonesian/kata-baku/kata_baku_data.js`

#### Analogi
- Multiple-choice analogy quiz (20 questions per session)
- Progress bar, accuracy tracking, explanation panel
- End-of-session performance summary

Files:
- `indonesian/analogi/index.html`
- `indonesian/analogi/app.js`
- `indonesian/analogi/analogi_data.js`

## Authentication and Access Control

Auth is handled globally by `guard.js`:
- redirects unauthenticated users to `auth/index.html`
- supports email/password sign in and sign up
- keeps `returnTo` navigation so users go back to the requested page after login
- mounts a floating/top-bar auth chip on app pages (email + sign out button)

Auth files:
- `guard.js`
- `auth/index.html`
- `auth/app.js`

Important:
- For auth flows, use `http://localhost` (not `file://`).
- `guard.js` also includes UI hardening (context menu and some inspect shortcuts disabled). This is UX hardening, not real security.

## Gamification and Progress Model

`gamification.js` stores and syncs:
- streak count and last active date
- total score
- per-day activity totals
- per-module daily counters

Storage strategy:
- Primary: Supabase tables (`user_gamification_stats`, `user_daily_activity`)
- Fallback/cache: localStorage (`brainGymStats`)

Cross-module activity updates happen in multiple modules (for example dictionary lookups, reading quizzes, grammar browsing, and Bahasa drills).

## Supabase Integration

Database migration:
- `supabase/migrations/20260310_mental_trainer_auth_persistence.sql`

Setup guide:
- `SUPABASE_SETUP.md`

Migration creates user-scoped tables and enables row-level security (RLS), including:
- `user_migrations`
- `user_gamification_stats`
- `user_daily_activity`
- `user_formula_favorites`
- `user_dictionary_history`
- `user_settings`
- `math_trainer_sessions`
- `math_trainer_solve_times`
- `math_trainer_wrong_answers`
- `user_module_state`

## Local Development

### 1. Start a local server
From the project root, run one of these:

```bash
# Python
python -m http.server 5500

# Node (if you prefer)
npx serve .
```

Then open:
- `http://localhost:5500/index.html`

### 2. Configure Supabase (if needed)
1. Run the SQL migration in your Supabase project.
2. Enable Email auth in Supabase Authentication.
3. Add your local URL to Supabase Auth URL settings.
4. Update Supabase URL and publishable key in `guard.js` if you are not using the current project.

## Tests

There is a Node test suite for Math Trainer persistence:

```bash
cd math-trainer
npm test
```

Current status in this repository: 4 tests passing.

## Project Structure (High Level)

```text
.
|- index.html
|- app.js
|- guard.js
|- gamification.js
|- auth/
|- math-trainer/
|- formula-notes/
|- geometry/
|- english/
|- indonesian/
|- supabase/migrations/
|- vendor/
`- icon/
```

## Content Customization

You can update learning content directly in data arrays:
- Formula categories: `formula-notes/app.js`
- Daily reading articles/questions: `english/daily-read/articles.js`
- Grammar flashcards: `english/grammar/app.js`
- Kata baku data: `indonesian/kata-baku/kata_baku_data.js`
- Analogy questions: `indonesian/analogi/analogi_data.js`

## Third-Party Services and Libraries

- Supabase (`@supabase/supabase-js`)
- KaTeX (formula rendering)
- Three.js + OrbitControls (3D geometry)
- Free Dictionary API (`https://api.dictionaryapi.dev`)
- Google Fonts

## License

MIT License. See `LICENSE`.
