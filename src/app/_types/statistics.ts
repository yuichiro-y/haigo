export type StatisticsDay = {
  workDate: string;
  totalRevenue: number;
};

export type StatisticsResponse = {
  days: StatisticsDay[];
  highestRevenueDay: StatisticsDay | null;
  monthlyRevenue: number;
  operatingDays: number;
  averageDay: number;
  deliveryTypesTotal: {
    [deliveryTypeId: string]: {
      name: string;
      quantity: number;
      revenue: number;
    }
  };
};