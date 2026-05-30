export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

export function attendanceStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'half-day':
      return 'Half Day';
    case 'leave':
      return 'Leave';
  }
}

export function attendanceStatusClass(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
    case 'absent':
      return 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20';
    case 'half-day':
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20';
    case 'leave':
      return 'bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/20';
  }
}
