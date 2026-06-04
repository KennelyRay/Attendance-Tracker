import type { AttendanceStatus } from '@/modules/attendance/types';
import type {
  EmployeeViolationRecord,
} from '@/modules/admin/types';

export type EmployeeAttendanceRecord = {
  id: number;
  user_id: number;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
};

export type EmployeeAttendanceStats = Record<AttendanceStatus, number>;

export type EmployeePortalProfile = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  startDate: string;
};

export type { EmployeeViolationRecord };
