/*
  # Add understanding checks to the database schema

  1. New Tables
    - `understanding_checks` - Stores polls that teachers send to students
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `question` (text)
      - `created_at` (timestamp)
    
    - `understanding_responses` - Stores student responses to understanding checks
      - `id` (uuid, primary key)
      - `check_id` (uuid, references understanding_checks)
      - `participant_id` (uuid, references participants)
      - `understood` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for teachers and students
*/

-- Create understanding_checks table
CREATE TABLE IF NOT EXISTS understanding_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question text NOT NULL DEFAULT 'Do you understand?',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on understanding_checks
ALTER TABLE understanding_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for understanding_checks
CREATE POLICY "Teachers can create understanding checks"
  ON understanding_checks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN lessons ON sessions.lesson_id = lessons.id
      WHERE sessions.id = understanding_checks.session_id
      AND lessons.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone in the session can view understanding checks"
  ON understanding_checks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      LEFT JOIN participants ON sessions.id = participants.session_id
      LEFT JOIN lessons ON sessions.lesson_id = lessons.id
      WHERE sessions.id = understanding_checks.session_id
      AND (participants.user_id = auth.uid() OR lessons.teacher_id = auth.uid())
    )
  );

-- Create understanding_responses table
CREATE TABLE IF NOT EXISTS understanding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id uuid NOT NULL REFERENCES understanding_checks(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  understood boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(check_id, participant_id)
);

-- Enable RLS on understanding_responses
ALTER TABLE understanding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for understanding_responses
CREATE POLICY "Students can create responses for checks in their sessions"
  ON understanding_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      JOIN understanding_checks ON understanding_checks.session_id = participants.session_id
      WHERE participants.id = understanding_responses.participant_id
      AND understanding_checks.id = understanding_responses.check_id
      AND participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view responses for their sessions"
  ON understanding_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM understanding_checks
      JOIN sessions ON sessions.id = understanding_checks.session_id
      JOIN lessons ON lessons.id = sessions.lesson_id
      WHERE understanding_checks.id = understanding_responses.check_id
      AND (lessons.teacher_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM participants
             WHERE participants.session_id = sessions.id
             AND participants.user_id = auth.uid()
             AND participants.id = understanding_responses.participant_id
           ))
    )
  );

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS understanding_checks_session_id_idx ON understanding_checks(session_id);
CREATE INDEX IF NOT EXISTS understanding_responses_check_id_idx ON understanding_responses(check_id);