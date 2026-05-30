'use client';

import { Select } from '@/components/ui/Select';

export function MonthYearPicker({
  month,
  year,
  onChangeMonth,
  onChangeYear,
}: {
  month: string;
  year: string;
  onChangeMonth: (month: string) => void;
  onChangeYear: (year: string) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="flex items-center gap-2">
      <div className="w-44">
        <Select value={month} onChange={(e) => onChangeMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m} value={m}>
              {new Date(0, parseInt(m) - 1).toLocaleString('default', {
                month: 'long',
              })}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-28">
        <Select value={year} onChange={(e) => onChangeYear(e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

