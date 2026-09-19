import { AmbientPageLoader } from '@/components/layout/AmbientPageLoader';

export default function Loading() {
  return (
    <AmbientPageLoader
      title="Loading your dashboard"
      description="Fetching employee, leave, and violation records."
    />
  );
}
