import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStats,
  EmployeePortalProfile,
  EmployeeViolationRecord,
} from '@/modules/employee/types';
import type {
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
} from '@/modules/leave/types';

export async function fetchMyAttendance(month: string, year: string): Promise<{
  records: EmployeeAttendanceRecord[];
  stats: EmployeeAttendanceStats;
}> {
  const response = await fetch(`/api/employee/attendance?month=${month}&year=${year}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch attendance');
  }
  return {
    records: data.records as EmployeeAttendanceRecord[],
    stats: data.stats as EmployeeAttendanceStats,
  };
}

export async function fetchMyLeaveData(): Promise<{
  balance: LeaveBalance;
  requests: LeaveRequest[];
}> {
  const response = await fetch('/api/employee/leave-requests', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch leave data');
  }

  return {
    balance: data.balance as LeaveBalance,
    requests: data.requests as LeaveRequest[],
  };
}

export async function fetchMyProfile(): Promise<EmployeePortalProfile> {
  const response = await fetch('/api/employee/profile', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch employee profile');
  }

  return data.user as EmployeePortalProfile;
}

export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<{
  request: LeaveRequest;
  balance: LeaveBalance;
}> {
  const formData = new FormData();
  formData.set('leaveType', input.leaveType);
  formData.set('startDate', input.startDate);
  formData.set('endDate', input.endDate);
  formData.set('reason', input.reason);
  formData.set('deductFromPaidBalance', String(Boolean(input.deductFromPaidBalance)));

  for (const attachment of input.attachments ?? []) {
    formData.append('attachments', attachment);
  }

  const response = await fetch('/api/employee/leave-requests', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to submit leave request');
  }

  return {
    request: data.request as LeaveRequest,
    balance: data.balance as LeaveBalance,
  };
}

export async function fetchMyViolations(): Promise<EmployeeViolationRecord[]> {
  const response = await fetch('/api/employee/violations', { cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch violations');
  }

  return data.violations as EmployeeViolationRecord[];
}
