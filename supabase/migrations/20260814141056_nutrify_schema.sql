/*
# Nutrify — Full Application Schema

## Overview
Creates the complete database schema for the Nutrify nutrition app (1M1B Changemakers World Cup).
This is a single-tenant app with no sign-in screen — the frontend uses the anon key directly,
so all policies allow both `anon` and `authenticated` roles to read and write.

## New Tables

1. **profiles** — User onboarding data (name, age, gender, height, weight, profession, activity, goal, diet, location).
   One row per user session, identified by a client-generated UUID stored in LocalStorage.

2. **meal_logs** — Records of meals generated/consumed. Tracks meal type, calories, protein, date.
   Linked to profiles via `profile_id`.

3. **water_logs** — Daily water intake entries (glasses of water). Linked to profiles.

4. **waste_logs** — Food waste rescue actions. Tracks ingredients rescued, meals created, kg avoided, date.
   Linked to profiles.

5. **challenge_days** — 7-Day Smart Plate Challenge tracking. One row per day per profile.
   Tracks balanced_meal, water_goal, used_leftovers booleans + day number + date.

6. **surveys** — Community impact survey data (Mission 2). Stores volunteer count, before/after averages.
   Single shared table for aggregate community metrics.

7. **interviews** — Interview wall entries. Stores name, profession, quote, date for display on the Community Impact page.

## Security
- RLS enabled on every table.
- All policies use `TO anon, authenticated` since this is a no-auth single-tenant app.
- All data is intentionally shared/public across the app — no ownership isolation needed.
- `USING (true)` / `WITH CHECK (true)` is correct here because the app has no sign-in and all data is shared.

## Notes
- All tables use `gen_random_uuid()` for primary keys.
- `created_at` defaults to `now()`.
- Foreign keys use `ON DELETE CASCADE` so deleting a profile cleans up child rows.
- Idempotent: uses `IF NOT EXISTS` for tables and `DROP POLICY IF EXISTS` before creating policies.
*/

-- ===== PROFILES =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age int,
  gender text,
  date_of_birth date,
  height numeric,
  weight numeric,
  profession text,
  student_class text,
  organization text,
  city text,
  country text,
  activity text,
  goal text,
  diet text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;
CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ===== MEAL_LOGS =====
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type text NOT NULL,
  meal_name text,
  calories int,
  protein numeric,
  logged_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meal_logs" ON meal_logs;
CREATE POLICY "anon_select_meal_logs" ON meal_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meal_logs" ON meal_logs;
CREATE POLICY "anon_insert_meal_logs" ON meal_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meal_logs" ON meal_logs;
CREATE POLICY "anon_update_meal_logs" ON meal_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meal_logs" ON meal_logs;
CREATE POLICY "anon_delete_meal_logs" ON meal_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ===== WATER_LOGS =====
CREATE TABLE IF NOT EXISTS water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  glasses int NOT NULL DEFAULT 0,
  logged_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_water_logs" ON water_logs;
CREATE POLICY "anon_select_water_logs" ON water_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_water_logs" ON water_logs;
CREATE POLICY "anon_insert_water_logs" ON water_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_water_logs" ON water_logs;
CREATE POLICY "anon_update_water_logs" ON water_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_water_logs" ON water_logs;
CREATE POLICY "anon_delete_water_logs" ON water_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ===== WASTE_LOGS =====
CREATE TABLE IF NOT EXISTS waste_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ingredients_rescued text[],
  meal_created text,
  kg_avoided numeric,
  logged_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_waste_logs" ON waste_logs;
CREATE POLICY "anon_select_waste_logs" ON waste_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_waste_logs" ON waste_logs;
CREATE POLICY "anon_insert_waste_logs" ON waste_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_waste_logs" ON waste_logs;
CREATE POLICY "anon_update_waste_logs" ON waste_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_waste_logs" ON waste_logs;
CREATE POLICY "anon_delete_waste_logs" ON waste_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ===== CHALLENGE_DAYS =====
CREATE TABLE IF NOT EXISTS challenge_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  day_number int NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  balanced_meal boolean DEFAULT false,
  water_goal boolean DEFAULT false,
  used_leftovers boolean DEFAULT false,
  logged_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, day_number)
);

ALTER TABLE challenge_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_challenge_days" ON challenge_days;
CREATE POLICY "anon_select_challenge_days" ON challenge_days FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_challenge_days" ON challenge_days;
CREATE POLICY "anon_insert_challenge_days" ON challenge_days FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_challenge_days" ON challenge_days;
CREATE POLICY "anon_update_challenge_days" ON challenge_days FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_challenge_days" ON challenge_days;
CREATE POLICY "anon_delete_challenge_days" ON challenge_days FOR DELETE
  TO anon, authenticated USING (true);

-- ===== SURVEYS (Community Impact — Mission 2) =====
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_volunteers int DEFAULT 0,
  before_average numeric,
  after_average numeric,
  active_participants int DEFAULT 0,
  label text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_surveys" ON surveys;
CREATE POLICY "anon_select_surveys" ON surveys FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_surveys" ON surveys;
CREATE POLICY "anon_insert_surveys" ON surveys FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_surveys" ON surveys;
CREATE POLICY "anon_update_surveys" ON surveys FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_surveys" ON surveys;
CREATE POLICY "anon_delete_surveys" ON surveys FOR DELETE
  TO anon, authenticated USING (true);

-- ===== INTERVIEWS (Interview Wall) =====
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  profession text,
  quote text NOT NULL,
  interview_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_interviews" ON interviews;
CREATE POLICY "anon_select_interviews" ON interviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_interviews" ON interviews;
CREATE POLICY "anon_insert_interviews" ON interviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_interviews" ON interviews;
CREATE POLICY "anon_update_interviews" ON interviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_interviews" ON interviews;
CREATE POLICY "anon_delete_interviews" ON interviews FOR DELETE
  TO anon, authenticated USING (true);

-- ===== INDEXES for query performance =====
CREATE INDEX IF NOT EXISTS idx_meal_logs_profile ON meal_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_profile ON water_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_waste_logs_profile ON waste_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_date ON waste_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_challenge_days_profile ON challenge_days(profile_id);
