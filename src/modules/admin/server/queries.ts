import { getPool } from '@/lib/db';
import { ensureUserAccessColumns } from '@/lib/user-access';
import { ensureViolationSystemSchema } from '@/lib/violation-system';
import type {
  AdminAttendanceRecord,
  AdminViolationRecord,
  CreateViolationInput,
  EmployeeViolationRecord,
  Employee,
  UpdateViolationInput,
} from '@/modules/admin/types';
import { normalizeDateOnly } from '@/modules/leave/utils';

export async function listEmployees(): Promise<Employee[]> {
  const pool = getPool();
  await ensureUserAccessColumns(pool);
  const result = await pool.query(
    `
      SELECT id, name, email, company, position, start_date, is_banned, restricted_until, created_at
      FROM users
      WHERE is_admin = false
      ORDER BY name
    `
  );
  return result.rows.map((row) => ({
    ...row,
    start_date: normalizeDateOnly(row.start_date),
  })) as Employee[];
}

export async function getAttendanceHistoryForEmployee(
  userId: number
): Promise<AdminAttendanceRecord[]> {
  const pool = getPool();
  await ensureUserAccessColumns(pool);
  const result = await pool.query(
    `
      SELECT ar.*, u.name as user_name
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.user_id = $1
      ORDER BY ar.date DESC
    `,
    [userId]
  );
  return result.rows as AdminAttendanceRecord[];
}

export async function listViolationCases(): Promise<AdminViolationRecord[]> {
  const pool = getPool();
  await ensureViolationSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        ev.id,
        ev.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.position AS user_position,
        ev.violation_type,
        ev.company,
        ev.severity,
        ev.case_status,
        ev.incident_date,
        ev.description,
        ev.action_taken,
        ev.created_by,
        admin_user.name AS created_by_name,
        ev.created_at
      FROM employee_violations ev
      JOIN users u ON u.id = ev.user_id
      LEFT JOIN users admin_user ON admin_user.id = ev.created_by
      ORDER BY ev.incident_date DESC, ev.created_at DESC, ev.id DESC
    `
  );

  return result.rows.map((row) => ({
    ...row,
    incident_date: normalizeDateOnly(row.incident_date),
  })) as AdminViolationRecord[];
}

export async function createViolationCase(
  adminId: number,
  input: CreateViolationInput
): Promise<AdminViolationRecord> {
  const pool = getPool();
  await ensureViolationSystemSchema(pool);

  const employeeId = Number(input.userId);
  const cleanViolationType = input.violationType.trim();
  const cleanCompany = input.company?.trim() || null;
  const cleanDescription = input.description.trim();
  const cleanActionTaken = input.actionTaken?.trim() || null;

  if (!Number.isInteger(employeeId)) {
    throw new Error('Please select a valid employee');
  }

  if (!cleanViolationType) {
    throw new Error('Violation type is required');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.incidentDate)) {
    throw new Error('Please provide a valid incident date');
  }

  if (!cleanDescription) {
    throw new Error('Violation details are required');
  }

  if (!['low', 'medium', 'high'].includes(input.severity)) {
    throw new Error('Please select a valid severity');
  }

  if (!['open', 'under-review', 'resolved'].includes(input.caseStatus)) {
    throw new Error('Please select a valid case status');
  }

  const employeeResult = await pool.query(
    `
      SELECT id
      FROM users
      WHERE id = $1 AND is_admin = false
      LIMIT 1
    `,
    [employeeId]
  );

  if (employeeResult.rows.length === 0) {
    throw new Error('Selected employee was not found');
  }

  const result = await pool.query(
    `
      INSERT INTO employee_violations (
        user_id,
        violation_type,
        company,
        severity,
        case_status,
        incident_date,
        description,
        action_taken,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
    [
      employeeId,
      cleanViolationType,
      cleanCompany,
      input.severity,
      input.caseStatus,
      input.incidentDate,
      cleanDescription,
      cleanActionTaken,
      adminId,
    ]
  );

  const violationId = result.rows[0]?.id;
  const createdViolationList = await pool.query(
    `
      SELECT
        ev.id,
        ev.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.position AS user_position,
        ev.violation_type,
        ev.company,
        ev.severity,
        ev.case_status,
        ev.incident_date,
        ev.description,
        ev.action_taken,
        ev.created_by,
        admin_user.name AS created_by_name,
        ev.created_at
      FROM employee_violations ev
      JOIN users u ON u.id = ev.user_id
      LEFT JOIN users admin_user ON admin_user.id = ev.created_by
      WHERE ev.id = $1
      LIMIT 1
    `,
    [violationId]
  );

  return {
    ...createdViolationList.rows[0],
    incident_date: normalizeDateOnly(createdViolationList.rows[0]?.incident_date),
  } as AdminViolationRecord;
}

export async function updateViolationCase(
  adminId: number,
  input: UpdateViolationInput
): Promise<AdminViolationRecord> {
  const pool = getPool();
  await ensureViolationSystemSchema(pool);

  const violationId = Number(input.violationId);
  const cleanViolationType = input.violationType.trim();
  const cleanCompany = input.company?.trim() || null;
  const cleanDescription = input.description.trim();
  const cleanActionTaken = input.actionTaken?.trim() || null;

  if (!Number.isInteger(violationId)) {
    throw new Error('Invalid violation case');
  }

  if (!cleanViolationType) {
    throw new Error('Violation type is required');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.incidentDate)) {
    throw new Error('Please provide a valid incident date');
  }

  if (!cleanDescription) {
    throw new Error('Violation details are required');
  }

  if (!['low', 'medium', 'high'].includes(input.severity)) {
    throw new Error('Please select a valid severity');
  }

  if (!['open', 'under-review', 'resolved'].includes(input.caseStatus)) {
    throw new Error('Please select a valid case status');
  }

  const updateResult = await pool.query(
    `
      UPDATE employee_violations
      SET
        violation_type = $2,
        company = $3,
        severity = $4,
        case_status = $5,
        incident_date = $6,
        description = $7,
        action_taken = $8
      WHERE id = $1
      RETURNING id
    `,
    [
      violationId,
      cleanViolationType,
      cleanCompany,
      input.severity,
      input.caseStatus,
      input.incidentDate,
      cleanDescription,
      cleanActionTaken,
    ]
  );

  if (updateResult.rows.length === 0) {
    throw new Error('Violation case not found');
  }

  const result = await pool.query(
    `
      SELECT
        ev.id,
        ev.user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.position AS user_position,
        ev.violation_type,
        ev.company,
        ev.severity,
        ev.case_status,
        ev.incident_date,
        ev.description,
        ev.action_taken,
        ev.created_by,
        COALESCE(admin_user.name, editor_user.name) AS created_by_name,
        ev.created_at
      FROM employee_violations ev
      JOIN users u ON u.id = ev.user_id
      LEFT JOIN users admin_user ON admin_user.id = ev.created_by
      LEFT JOIN users editor_user ON editor_user.id = $2
      WHERE ev.id = $1
      LIMIT 1
    `,
    [violationId, adminId]
  );

  return {
    ...result.rows[0],
    incident_date: normalizeDateOnly(result.rows[0]?.incident_date),
  } as AdminViolationRecord;
}

export async function listViolationsForUser(
  userId: number
): Promise<EmployeeViolationRecord[]> {
  const pool = getPool();
  await ensureViolationSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        id,
        violation_type,
        company,
        severity,
        case_status,
        incident_date,
        description,
        action_taken,
        created_at
      FROM employee_violations
      WHERE user_id = $1
      ORDER BY incident_date DESC, created_at DESC, id DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    incident_date: normalizeDateOnly(row.incident_date),
  })) as EmployeeViolationRecord[];
}
