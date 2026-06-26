export interface MonthlyRevenue {
  month: number;
  year: number;
  label: string;
  revenue: number;
  collected: number;
  outstanding: number;
  invoiceCount: number;
}

export interface CategoryRevenue {
  category: string;
  amount: number;
  count: number;
  pct: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  totalCost: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryDistribution: { category: string; count: number; value: number }[];
}

export interface ExpenseSummary {
  month: number;
  year: number;
  label: string;
  total: number;
  byCategory: { category: string; amount: number }[];
}

export interface ProfitSummary {
  month: number;
  year: number;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

function formatEGP(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: 1, year: 2026, label: 'يناير 2026', revenue: 89000, collected: 72000, outstanding: 17000, invoiceCount: 5 },
  { month: 2, year: 2026, label: 'فبراير 2026', revenue: 135000, collected: 110000, outstanding: 25000, invoiceCount: 7 },
  { month: 3, year: 2026, label: 'مارس 2026', revenue: 167000, collected: 145000, outstanding: 22000, invoiceCount: 9 },
  { month: 4, year: 2026, label: 'أبريل 2026', revenue: 142000, collected: 120000, outstanding: 22000, invoiceCount: 8 },
  { month: 5, year: 2026, label: 'مايو 2026', revenue: 198000, collected: 165000, outstanding: 33000, invoiceCount: 11 },
  { month: 6, year: 2026, label: 'يونيو 2026', revenue: 589500, collected: 89200, outstanding: 500300, invoiceCount: 8 },
];

export const categoryRevenue: CategoryRevenue[] = [
  { category: 'تركيب أجهزة تكييف', amount: 420000, count: 15, pct: 32 },
  { category: 'صيانة وإصلاح', amount: 350000, count: 22, pct: 26 },
  { category: 'قطع غيار', amount: 280000, count: 18, pct: 21 },
  { category: 'عقود صيانة سنوية', amount: 180000, count: 3, pct: 14 },
  { category: 'استشارات هندسية', amount: 90500, count: 8, pct: 7 },
];

export const topClients: TopClient[] = [
  { clientId: 'c008', clientName: 'مدرسة المستقبل الخاصة', totalRevenue: 270000, invoiceCount: 1 },
  { clientId: 'c004', clientName: 'مؤسسة النيل للمقاولات', totalRevenue: 287400, invoiceCount: 3 },
  { clientId: 'c002', clientName: 'شركة الأمل للتجارة', totalRevenue: 184800, invoiceCount: 3 },
  { clientId: 'c006', clientName: 'فندق السلام طنطا', totalRevenue: 132400, invoiceCount: 2 },
  { clientId: 'c001', clientName: 'أحمد محمد محمود', totalRevenue: 96300, invoiceCount: 2 },
  { clientId: 'c007', clientName: 'كريم سامي فؤاد', totalRevenue: 55300, invoiceCount: 2 },
  { clientId: 'c003', clientName: 'سارة عبد الرحمن', totalRevenue: 37880, invoiceCount: 2 },
  { clientId: 'c005', clientName: 'محمد علي حسن', totalRevenue: 20520, invoiceCount: 1 },
];

export const inventorySummary: InventorySummary = {
  totalItems: 22,
  totalValue: 1324650,
  totalCost: 946800,
  potentialProfit: 377850,
  lowStockCount: 1,
  outOfStockCount: 0,
  categoryDistribution: [
    { category: 'أجهزة تكييف', count: 5, value: 588000 },
    { category: 'كمبروسرات وقطع غيار', count: 4, value: 265000 },
    { category: 'مواسير وعوازل', count: 3, value: 89500 },
    { category: 'فريون وغازات تبريد', count: 3, value: 92000 },
    { category: 'فلاتر واكسسوارات', count: 3, value: 48100 },
    { category: 'مواد تركيب وكيماويات', count: 3, value: 242050 },
  ],
};

export const monthlyExpenses: ExpenseSummary[] = [
  { month: 1, year: 2026, label: 'يناير 2026', total: 109700, byCategory: [{ category: 'رواتب وأجور', amount: 74000 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 4200 }, { category: 'صيانة سيارات', amount: 6800 }, { category: 'رسوم وضرائب', amount: 8500 }, { category: 'مصروفات متنوعة', amount: 1200 }] },
  { month: 2, year: 2026, label: 'فبراير 2026', total: 111400, byCategory: [{ category: 'رواتب وأجور', amount: 75500 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 3800 }, { category: 'صيانة سيارات', amount: 9500 }, { category: 'مشتريات تشغيلية', amount: 2100 }, { category: 'تسويق وإعلانات', amount: 5500 }] },
  { month: 3, year: 2026, label: 'مارس 2026', total: 115200, byCategory: [{ category: 'رواتب وأجور', amount: 77000 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 5500 }, { category: 'صيانة سيارات', amount: 7200 }, { category: 'تسويق وإعلانات', amount: 7000 }, { category: 'مصروفات متنوعة', amount: 3500 }] },
  { month: 4, year: 2026, label: 'أبريل 2026', total: 124900, byCategory: [{ category: 'رواتب وأجور', amount: 76500 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 6100 }, { category: 'صيانة سيارات', amount: 6500 }, { category: 'مشتريات تشغيلية', amount: 18000 }, { category: 'مصروفات متنوعة', amount: 2800 }] },
  { month: 5, year: 2026, label: 'مايو 2026', total: 115000, byCategory: [{ category: 'رواتب وأجور', amount: 78000 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 7200 }, { category: 'صيانة سيارات', amount: 7100 }, { category: 'تسويق وإعلانات', amount: 4500 }, { category: 'رسوم وضرائب', amount: 3200 }] },
  { month: 6, year: 2026, label: 'يونيو 2026', total: 122400, byCategory: [{ category: 'رواتب وأجور', amount: 76500 }, { category: 'إيجارات', amount: 15000 }, { category: 'كهرباء ومياه', amount: 8200 }, { category: 'صيانة سيارات', amount: 4200 }, { category: 'تسويق وإعلانات', amount: 6000 }, { category: 'مشتريات تشغيلية', amount: 12000 }, { category: 'مصروفات متنوعة', amount: 5500 }] },
];

export const monthlyProfits: ProfitSummary[] = [
  { month: 1, year: 2026, label: 'يناير 2026', revenue: 89000, expenses: 109700, profit: -20700, margin: -23.3 },
  { month: 2, year: 2026, label: 'فبراير 2026', revenue: 135000, expenses: 111400, profit: 23600, margin: 17.5 },
  { month: 3, year: 2026, label: 'مارس 2026', revenue: 167000, expenses: 115200, profit: 51800, margin: 31.0 },
  { month: 4, year: 2026, label: 'أبريل 2026', revenue: 142000, expenses: 124900, profit: 17100, margin: 12.0 },
  { month: 5, year: 2026, label: 'مايو 2026', revenue: 198000, expenses: 115000, profit: 83000, margin: 41.9 },
  { month: 6, year: 2026, label: 'يونيو 2026', revenue: 589500, expenses: 122400, profit: 467100, margin: 79.2 },
];

export const totalStats = {
  totalRevenueYTD: 1320500,
  totalExpensesYTD: 698600,
  totalProfitYTD: 621900,
  overallMargin: 47.1,
  receivablesOutstanding: 500300,
  totalInvoicesYTD: 48,
  totalClients: 8,
  totalEmployees: 10,
  totalSuppliers: 8,
  inventoryValue: 1324650,
  purchaseOrdersYTD: 16,
  maintenanceCompleted: 7,
  maintenancePending: 4,
};

export { formatEGP };