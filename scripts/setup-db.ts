import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getPool } from '../src/lib/db';
import bcrypt from 'bcrypt';

async function setupDatabase() {
  let pool;
  try {
    pool = getPool();
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        company VARCHAR(255),
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

      CREATE TABLE IF NOT EXISTS employee_violations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        violation_type VARCHAR(120) NOT NULL,
        company VARCHAR(255) NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        case_status VARCHAR(20) NOT NULL DEFAULT 'open',
        incident_date DATE NOT NULL,
        description TEXT NOT NULL,
        action_taken TEXT NULL,
        created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT employee_violations_severity CHECK (severity IN ('low', 'medium', 'high')),
        CONSTRAINT employee_violations_case_status CHECK (
          case_status IN ('open', 'under-review', 'resolved')
        )
      );

      CREATE OR REPLACE FUNCTION upsert_attendance(
        p_user_id INTEGER,
        p_date DATE,
        p_status TEXT,
        p_notes TEXT,
        p_created_by INTEGER
      ) RETURNS VOID AS $$
      BEGIN
        IF p_status <> 'leave' AND EXISTS (
          SELECT 1
          FROM attendance_leave
          WHERE user_id = p_user_id
            AND date = p_date
            AND notes LIKE 'Approved leave:%'
        ) THEN
          RAISE EXCEPTION 'Approved leave exists for this date and cannot be overwritten';
        END IF;

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
    `;
    
    await pool.query(schema);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMP NULL;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS position VARCHAR(255) NULL;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS start_date DATE;

      UPDATE users
      SET start_date = COALESCE(start_date, created_at::date, CURRENT_DATE);

      ALTER TABLE users
      ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

      ALTER TABLE users
      ALTER COLUMN start_date SET NOT NULL;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'role'
        ) THEN
          UPDATE users SET is_admin = TRUE WHERE role = 'admin';
          ALTER TABLE users DROP COLUMN role;
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'attendance_records' AND c.relkind = 'r'
        ) THEN
          INSERT INTO attendance_present (user_id, date, notes, created_by, created_at)
          SELECT user_id, date, notes, created_by, created_at
          FROM attendance_records
          WHERE status = 'present'
          ON CONFLICT (user_id, date) DO NOTHING;

          INSERT INTO attendance_absent (user_id, date, notes, created_by, created_at)
          SELECT user_id, date, notes, created_by, created_at
          FROM attendance_records
          WHERE status = 'absent'
          ON CONFLICT (user_id, date) DO NOTHING;

          INSERT INTO attendance_half_day (user_id, date, notes, created_by, created_at)
          SELECT user_id, date, notes, created_by, created_at
          FROM attendance_records
          WHERE status = 'half-day'
          ON CONFLICT (user_id, date) DO NOTHING;

          INSERT INTO attendance_leave (user_id, date, notes, created_by, created_at)
          SELECT user_id, date, notes, created_by, created_at
          FROM attendance_records
          WHERE status = 'leave'
          ON CONFLICT (user_id, date) DO NOTHING;

          ALTER TABLE attendance_records RENAME TO attendance_records_legacy;
        END IF;
      END $$;
    `);

    await pool.query(`
      DROP VIEW IF EXISTS attendance_records;

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
    `);
    console.log('Database schema created successfully!');
    
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedEmployeePassword = await bcrypt.hash('employee123', 10);
    
    await pool.query(
      `INSERT INTO users (name, email, password, company, position, start_date, is_admin) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@company.com', hashedAdminPassword, 'Head Office', 'Manager', '2020-01-15', true]
    );
    
    await pool.query(
      `INSERT INTO users (name, email, password, company, position, start_date, is_admin) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING`,
      ['John Doe', 'john@company.com', hashedEmployeePassword, 'Head Office', 'Staff', '2024-01-15', false]
    );
    
    console.log('Sample users created!');
    console.log('Admin login: admin@company.com / admin123');
    console.log('Employee login: john@company.com / employee123');
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupDatabase();
