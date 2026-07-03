export interface Store {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface WeeklySales {
  week: string;
  store_id: string;
  product_category: string;
  gross_sales: number;
  net_sales: number;
  target_sales: number;
  return_amount: number;
  discount_amount: number;
  transactions_count: number;
  stockout_risk: number; // 1 for stockout, 0 for healthy stock
}

export interface MergedSalesRecord extends WeeklySales {
  store_name: string;
  region: string;
  city: string;
  store_format: string;
}

export interface DashboardFilters {
  weeks: string[];
  regions: string[];
  stores: string[];
  cities: string[];
  storeFormats: string[];
  categories: string[];
}

export interface SummaryMetrics {
  netSales: number;
  grossSales: number;
  targetSales: number;
  targetAchievement: number; // percentage
  averageTransactionValue: number; // ATV
  returnAmount: number;
  returnRate: number; // percentage (return_amount/net_sales * 100)
  discountAmount: number;
  discountRate: number; // percentage (discount_amount/gross_sales * 100)
  stockoutCount: number;
  stockoutRate: number; // percentage
  transactionsCount: number;
  conversionRate: number; // percentage
}
