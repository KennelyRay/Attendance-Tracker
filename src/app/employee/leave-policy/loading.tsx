import { AmbientPageLoader } from '@/components/layout/AmbientPageLoader';

export default function Loading() {
  return (
    <AmbientPageLoader
      title="Loading the leave policy"
      description="Fetching the current leave guidance."
    />
  );
}
