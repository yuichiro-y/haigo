export type CalendarDay = {
  workDate: string;
  totalRevenue: number;
};

export type CalendarResponse = {
  monthlyRevenue: number;
  operatingDays: number;
  averageDay: number;
  days: CalendarDay[];
};