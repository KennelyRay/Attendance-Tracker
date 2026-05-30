import type {
  AdminAttendanceRecord,
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeAccountInput,
  UpdateEmployeeAccessInput,
  UpsertAttendanceInput,
} from '@/modules/admin/types';

export async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch('/api/admin/users', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch employees');
  }
  return data.users as Employee[];
}

export async function fetchAttendanceHistory(
  userId: number
): Promise<AdminAttendanceRecord[]> {
  const response = await fetch(`/api/admin/attendance?userId=${userId}`, { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch attendance');
  }
  return data.records as AdminAttendanceRecord[];
}

export async function upsertAttendance(input: UpsertAttendanceInput): Promise<void> {
  const response = await fetch('/api/admin/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to save attendance');
  }
}

export async function createEmployeeAccount(input: CreateEmployeeInput): Promise<Employee> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to create account');
  }
  return data.user as Employee;
}

export async function updateEmployeeAccess(input: UpdateEmployeeAccessInput): Promise<Employee> {
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to update account');
  }
  return data.user as Employee;
}

export async function updateEmployeeAccount(input: UpdateEmployeeAccountInput): Promise<Employee> {
  const response = await fetch('/api/admin/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to update account');
  }
  return data.user as Employee;
}

export async function deleteEmployeeAccount(userId: number): Promise<void> {
  const response = await fetch('/api/admin/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to remove account');
  }
}
