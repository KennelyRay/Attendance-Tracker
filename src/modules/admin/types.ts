import type { AttendanceStatus } from '@/modules/attendance/types';

export type Employee = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  start_date: string;
  is_banned: boolean;
  restricted_until: string | null;
  created_at: string;
};

export type AdminAttendanceRecord = {
  id: number;
  user_id: number;
  user_name: string;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
};

export type UpsertAttendanceInput = {
  userId: number;
  date: string;
  status: AttendanceStatus;
  notes?: string;
};

export type AccountStatus = 'active' | 'restricted' | 'banned';

export type CreateEmployeeInput = {
  name: string;
  email: string;
  company: string;
  position: string;
  startDate: string;
  password: string;
};

export type UpdateEmployeeAccountInput = {
  userId: number;
  name: string;
  email: string;
  company: string;
  position: string;
  startDate: string;
  password?: string;
};

export type UpdateEmployeeAccessInput = {
  userId: number;
  action: 'ban' | 'restrict' | 'restore';
  durationHours?: number;
};

export type ViolationSeverity = 'low' | 'medium' | 'high';

export type ViolationCaseStatus = 'open' | 'under-review' | 'resolved';

export type AdminViolationRecord = {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_position: string | null;
  violation_type: string;
  company: string | null;
  severity: ViolationSeverity;
  case_status: ViolationCaseStatus;
  incident_date: string;
  description: string;
  action_taken: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  appeal_message: string | null;
  appealed_at: string | null;
  appeal_verdict: string | null;
  appeal_resolved_at: string | null;
};

export type EmployeeViolationRecord = {
  id: number;
  violation_type: string;
  company: string | null;
  severity: ViolationSeverity;
  case_status: ViolationCaseStatus;
  incident_date: string;
  description: string;
  action_taken: string | null;
  created_at: string;
  appeal_message: string | null;
  appealed_at: string | null;
  appeal_verdict: string | null;
  appeal_resolved_at: string | null;
};

export type AppealViolationInput = {
  violationId: number;
  message: string;
};

export type ResolveViolationAppealInput = {
  violationId: number;
  verdict: string;
};

export type CreateViolationInput = {
  userId: number;
  violationType: string;
  company?: string;
  severity: ViolationSeverity;
  caseStatus: ViolationCaseStatus;
  incidentDate: string;
  description: string;
  actionTaken?: string;
};

export type UpdateViolationInput = {
  violationId: number;
  violationType: string;
  company?: string;
  severity: ViolationSeverity;
  caseStatus: ViolationCaseStatus;
  incidentDate: string;
  description: string;
  actionTaken?: string;
};

export function employeeAccountStatus(employee: Pick<Employee, 'is_banned' | 'restricted_until'>): AccountStatus {
  if (employee.is_banned) {
    return 'banned';
  }

  if (employee.restricted_until) {
    const restrictedUntil = new Date(employee.restricted_until);
    if (!Number.isNaN(restrictedUntil.getTime()) && restrictedUntil > new Date()) {
      return 'restricted';
    }
  }

  return 'active';
}
