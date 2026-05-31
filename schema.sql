CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  restricted_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_present (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_absent (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_half_day (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_leave (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR(64) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  deduct_from_paid_balance BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_notes TEXT NULL,
  reviewed_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT leave_requests_date_range CHECK (end_date >= start_date),
  CONSTRAINT leave_requests_total_days CHECK (total_days > 0),
  CONSTRAINT leave_requests_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE OR REPLACE VIEW attendance_records AS
  SELECT id, user_id, date, 'present'::text AS status, notes, created_by, created_at
  FROM attendance_present
  UNION ALL
  SELECT id, user_id, date, 'absent'::text AS status, notes, created_by, created_at
  FROM attendance_absent
  UNION ALL
  SELECT id, user_id, date, 'half-day'::text AS status, notes, created_by, created_at
  FROM attendance_half_day
  UNION ALL
  SELECT id, user_id, date, 'leave'::text AS status, notes, created_by, created_at
  FROM attendance_leave;

CREATE OR REPLACE FUNCTION upsert_attendance(
  p_user_id INTEGER,
  p_date DATE,
  p_status TEXT,
  p_notes TEXT,
  p_created_by INTEGER
) RETURNS VOID AS $$
BEGIN
  DELETE FROM attendance_present WHERE user_id = p_user_id AND date = p_date;
  DELETE FROM attendance_absent WHERE user_id = p_user_id AND date = p_date;
  DELETE FROM attendance_half_day WHERE user_id = p_user_id AND date = p_date;
  DELETE FROM attendance_leave WHERE user_id = p_user_id AND date = p_date;

  IF p_status = 'present' THEN
    INSERT INTO attendance_present (user_id, date, notes, created_by, created_at)
    VALUES (p_user_id, p_date, p_notes, p_created_by, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, date)
    DO UPDATE SET notes = EXCLUDED.notes, created_by = EXCLUDED.created_by, created_at = CURRENT_TIMESTAMP;
  ELSIF p_status = 'absent' THEN
    INSERT INTO attendance_absent (user_id, date, notes, created_by, created_at)
    VALUES (p_user_id, p_date, p_notes, p_created_by, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, date)
    DO UPDATE SET notes = EXCLUDED.notes, created_by = EXCLUDED.created_by, created_at = CURRENT_TIMESTAMP;
  ELSIF p_status = 'half-day' THEN
    INSERT INTO attendance_half_day (user_id, date, notes, created_by, created_at)
    VALUES (p_user_id, p_date, p_notes, p_created_by, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, date)
    DO UPDATE SET notes = EXCLUDED.notes, created_by = EXCLUDED.created_by, created_at = CURRENT_TIMESTAMP;
  ELSIF p_status = 'leave' THEN
    INSERT INTO attendance_leave (user_id, date, notes, created_by, created_at)
    VALUES (p_user_id, p_date, p_notes, p_created_by, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, date)
    DO UPDATE SET notes = EXCLUDED.notes, created_by = EXCLUDED.created_by, created_at = CURRENT_TIMESTAMP;
  ELSE
    RAISE EXCEPTION 'Invalid attendance status: %', p_status;
  END IF;
END;
$$ LANGUAGE plpgsql;
