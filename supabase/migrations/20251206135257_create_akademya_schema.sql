/*
  # Create Akademya Database Schema

  1. New Tables
    - `student_profile`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `section` (text)
      - `course` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `academic_period`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - e.g., "Primer Lapso"
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `max_grade` (numeric) - nota máxima
      - `min_passing_grade` (numeric) - nota mínima para aprobar
      - `evaluation_percentage` (numeric) - porcentaje de evaluación
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `subjects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `period_id` (uuid, references academic_period)
      - `name` (text)
      - `professor` (text)
      - `accumulated_points` (numeric)
      - `current_grade` (numeric)
      - `color` (text) - color indicator
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `evaluations`
      - `id` (uuid, primary key)
      - `subject_id` (uuid, references subjects)
      - `name` (text)
      - `date` (date)
      - `grade` (numeric)
      - `weight` (numeric) - peso o porcentaje
      - `max_points` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create student_profile table
CREATE TABLE IF NOT EXISTS student_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  section text DEFAULT '',
  course text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON student_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON student_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON student_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON student_profile FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create academic_period table
CREATE TABLE IF NOT EXISTS academic_period (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE academic_period ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own periods"
  ON academic_period FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own periods"
  ON academic_period FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own periods"
  ON academic_period FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own periods"
  ON academic_period FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  max_grade numeric DEFAULT 20,
  min_passing_grade numeric DEFAULT 10,
  evaluation_percentage numeric DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  period_id uuid REFERENCES academic_period(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  professor text DEFAULT '',
  accumulated_points numeric DEFAULT 0,
  current_grade numeric DEFAULT 0,
  color text DEFAULT '#10b981',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  date date,
  grade numeric DEFAULT 0,
  weight numeric DEFAULT 0,
  max_points numeric DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = evaluations.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own evaluations"
  ON evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = evaluations.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own evaluations"
  ON evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = evaluations.subject_id
      AND subjects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = evaluations.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own evaluations"
  ON evaluations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = evaluations.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profile_user_id ON student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_period_user_id ON academic_period(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_period_id ON subjects(period_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_subject_id ON evaluations(subject_id);