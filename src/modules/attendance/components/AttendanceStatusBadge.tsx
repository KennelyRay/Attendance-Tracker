import { Badge } from '@/components/ui/Badge';
import {
  AttendanceStatus,
  attendanceStatusClass,
  attendanceStatusLabel,
} from '@/modules/attendance/types';

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge className={attendanceStatusClass(status)}>
      {attendanceStatusLabel(status)}
    </Badge>
  );
}

