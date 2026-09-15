export type HolidayType = 'regular' | 'special';

export type Holiday = {
  id: number;
  date: string;
  name: string;
  holiday_type: HolidayType;
  created_at: string;
};

export type CreateHolidayInput = {
  date: string;
  name: string;
  holidayType: HolidayType;
};

export const holidayTypeLabel: Record<HolidayType, string> = {
  regular: 'Regular holiday',
  special: 'Special non-working',
};
