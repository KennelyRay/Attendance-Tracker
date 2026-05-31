import type { AttendanceStatus } from '@/modules/attendance/types';

export type Employee = {
  id: number;
  name: string;
  email: string;
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
  position: string;
  startDate: string;
  password: string;
};

export type UpdateEmployeeAccountInput = {
  userId: number;
  name: string;
  email: string;
  position: string;
  startDate: string;
};

export type UpdateEmployeeAccessInput = {
  userId: number;
  action: 'ban' | 'restrict' | 'restore';
  durationHours?: number;
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
