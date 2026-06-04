export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export type LeaveType =
  | 'paid-leave'
  | 'maternity-live-birth'
  | 'maternity-miscarriage'
  | 'paternity'
  | 'solo-parent'
  | 'vawc'
  | 'mcw-special'
  | 'bereavement'
  | 'calamity-emergency'
  | 'court-summons'
  | 'military-reserve'
  | 'prc-board-exam';

export type LeaveTypePolicy = {
  value: LeaveType;
  label: string;
  category: 'paid' | 'statutory' | 'special' | 'civic';
  description: string;
  paidBy: string;
  filing: string;
  daysLabel: string;
  maxDaysPerRequest?: number;
  maxDaysPerYear?: number;
  requiresPaidBalance: boolean;
  canUsePaidBalance: boolean;
  minServiceMonths?: number;
};

export type LeaveBalance = {
  annualEntitlement: number;
  used: number;
  remaining: number;
  serviceYears: number;
  startDate: string;
};

export type LeaveRequest = {
  id: number;
  user_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  deduct_from_paid_balance: boolean;
  status: LeaveRequestStatus;
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AdminLeaveRequest = LeaveRequest & {
  user_name: string;
  user_email: string;
  user_company: string | null;
  user_position: string | null;
  user_start_date: string;
  user_leave_remaining: number;
  user_leave_entitlement: number;
};

export type CreateLeaveRequestInput = {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  deductFromPaidBalance?: boolean;
};

export type ReviewLeaveRequestInput = {
  requestId: number;
  action: 'approve' | 'reject';
  adminNotes?: string;
};
