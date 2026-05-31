import { AmbientPageLoader } from '@/components/layout/AmbientPageLoader';

export default function Loading() {
  return (
    <AmbientPageLoader
      title="Loading dashboard"
      description="Refreshing employee activity and attendance details."
    />
  );
}
