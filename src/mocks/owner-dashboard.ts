export interface BranchOverview {
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  revenueYTD: number;
  collectedYTD: number;
  outstandingYTD: number;
  expensesYTD: number;
  profitYTD: number;
  marginPct: number;
  invoiceCount: number;
  clientCount: number;
  employeeCount: number;
  activeEmployeeCount: number;
  inventoryValue: number;
  inventoryItems: number;
  lowStockCount: number;
  maintenanceTotal: number;
  maintenancePending: number;
  maintenanceCompleted: number;
  purchaseOrderCount: number;
  monthlyRevenue: { month: number; year: number; label: string; revenue: number; collected: number; outstanding: number }[];
}

export const branchOverviews: BranchOverview[] = [
  {
    branchId: '92329ba6-8ac4-4e78-bcb0-eec1ee4b8ab5',
    branchName: 'فرع طنطا',
    branchAddress: 'طنطا، شارع الجلاء، برج النصر',
    branchPhone: '040-1234567',
    revenueYTD: 720000,
    collectedYTD: 545000,
    outstandingYTD: 175000,
    expensesYTD: 365000,
    profitYTD: 355000,
    marginPct: 49.3,
    invoiceCount: 25,
    clientCount: 5,
    employeeCount: 6,
    activeEmployeeCount: 5,
    inventoryValue: 750000,
    inventoryItems: 12,
    lowStockCount: 0,
    maintenanceTotal: 9,
    maintenancePending: 2,
    maintenanceCompleted: 4,
    purchaseOrderCount: 9,
    monthlyRevenue: [
      { month: 1, year: 2026, label: 'يناير', revenue: 52000, collected: 42000, outstanding: 10000 },
      { month: 2, year: 2026, label: 'فبراير', revenue: 75000, collected: 60000, outstanding: 15000 },
      { month: 3, year: 2026, label: 'مارس', revenue: 92000, collected: 80000, outstanding: 12000 },
      { month: 4, year: 2026, label: 'أبريل', revenue: 78000, collected: 65000, outstanding: 13000 },
      { month: 5, year: 2026, label: 'مايو', revenue: 108000, collected: 90000, outstanding: 18000 },
      { month: 6, year: 2026, label: 'يونيو', revenue: 315000, collected: 208000, outstanding: 107000 },
    ],
  },
  {
    branchId: '48759753-ba27-408f-93c1-9a77d1629954',
    branchName: 'فرع الأحياء',
    branchAddress: 'طنطا، منطقة الأحياء، شارع المدارس',
    branchPhone: '040-7654321',
    revenueYTD: 380000,
    collectedYTD: 280000,
    outstandingYTD: 100000,
    expensesYTD: 210000,
    profitYTD: 170000,
    marginPct: 44.7,
    invoiceCount: 14,
    clientCount: 3,
    employeeCount: 4,
    activeEmployeeCount: 4,
    inventoryValue: 380000,
    inventoryItems: 7,
    lowStockCount: 1,
    maintenanceTotal: 5,
    maintenancePending: 1,
    maintenanceCompleted: 2,
    purchaseOrderCount: 4,
    monthlyRevenue: [
      { month: 1, year: 2026, label: 'يناير', revenue: 22000, collected: 18000, outstanding: 4000 },
      { month: 2, year: 2026, label: 'فبراير', revenue: 35000, collected: 28000, outstanding: 7000 },
      { month: 3, year: 2026, label: 'مارس', revenue: 45000, collected: 38000, outstanding: 7000 },
      { month: 4, year: 2026, label: 'أبريل', revenue: 38000, collected: 32000, outstanding: 6000 },
      { month: 5, year: 2026, label: 'مايو', revenue: 52000, collected: 44000, outstanding: 8000 },
      { month: 6, year: 2026, label: 'يونيو', revenue: 188000, collected: 120000, outstanding: 68000 },
    ],
  },
  {
    branchId: 'b23e9280-c0c6-4ac4-9703-684f31b9d0b9',
    branchName: 'فرع المدارس',
    branchAddress: 'طنطا، شارع المدارس، أمام كلية التجارة',
    branchPhone: '040-9876543',
    revenueYTD: 220500,
    collectedYTD: 175000,
    outstandingYTD: 45500,
    expensesYTD: 123600,
    profitYTD: 96900,
    marginPct: 43.9,
    invoiceCount: 9,
    clientCount: 2,
    employeeCount: 2,
    activeEmployeeCount: 2,
    inventoryValue: 194650,
    inventoryItems: 5,
    lowStockCount: 0,
    maintenanceTotal: 3,
    maintenancePending: 1,
    maintenanceCompleted: 1,
    purchaseOrderCount: 3,
    monthlyRevenue: [
      { month: 1, year: 2026, label: 'يناير', revenue: 15000, collected: 12000, outstanding: 3000 },
      { month: 2, year: 2026, label: 'فبراير', revenue: 25000, collected: 22000, outstanding: 3000 },
      { month: 3, year: 2026, label: 'مارس', revenue: 30000, collected: 27000, outstanding: 3000 },
      { month: 4, year: 2026, label: 'أبريل', revenue: 26000, collected: 23000, outstanding: 3000 },
      { month: 5, year: 2026, label: 'مايو', revenue: 38000, collected: 31000, outstanding: 7000 },
      { month: 6, year: 2026, label: 'يونيو', revenue: 86500, collected: 60000, outstanding: 26500 },
    ],
  },
];

export const ownerTotalStats = {
  totalRevenue: 1320500,
  totalProfit: 621900,
  totalOutstanding: 320500,
  totalInventoryValue: 1324650,
  totalEmployees: 12,
  activeEmployees: 10,
  totalClients: 8,
  totalInvoices: 48,
  totalMaintenance: 17,
  maintenancePending: 4,
  maintenanceCompleted: 7,
  totalSuppliers: 8,
  totalPurchaseOrders: 16,
  marginPct: 47.1,
};