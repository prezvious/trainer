# Mental Trainer Supabase Setup

## 1. Apply database migration

Run this SQL in Supabase SQL Editor:

- [`supabase/migrations/20260310_mental_trainer_auth_persistence.sql`](supabase/migrations/20260310_mental_trainer_auth_persistence.sql)

This creates:

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

It also enables/forces RLS and creates owner-only policies for all tables.

## 2. Configure Supabase Auth

In Supabase Dashboard:

1. Open `Authentication -> Providers` and enable `Email`.
2. Decide if email confirmation is required.
3. Add your site URL(s) in `Authentication -> URL Configuration`.

## 3. Client key usage

The app uses the publishable key in `guard.js`:

- Project URL: `https://surlnioadlpyfsjhxzam.supabase.co`
- Publishable key: `sb_publishable_skd2WWv_y6TPyU-2qJ-v5A_fRmMriib`

Do not place the secret key in browser code.

## 4. Auth entrypoint

New auth page:

- [`auth/index.html`](auth/index.html)

All app pages route unauthenticated users there via `guard.js`.

## 5. LocalStorage migration behavior

Migration runs automatically after user session is available.

Migrated keys:

- `brainGymStats`
- `mentalMathData` (legacy score sync input)
- `formulaFavorites`
- `brainGymDictHistory`
- `mathTrainer_sessions`
- `mathTrainer_solveTimes`
- `mathTrainer_history`
- `mathTrainer_settings`

Migration markers are stored in `user_migrations` to keep migration idempotent.
