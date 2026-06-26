import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/auth/login/page";
import TwoFactorPage from "@/pages/auth/2fa/page";
import DashboardPage from "@/pages/dashboard/page";
import BillingPage from "@/pages/billing/page";
import InvoiceDetailPage from "@/pages/billing/detail/page";
import NewInvoicePage from "@/pages/billing/new/page";
import InventoryPage from "@/pages/inventory/page";
import InventoryDetailPage from "@/pages/inventory/detail/page";
import NewInventoryItemPage from "@/pages/inventory/new/page";
import AppShell from "@/components/feature/AppShell";
import { AuthGuard } from "@/components/feature/AuthGuard";
import HrPage from "@/pages/hr/page";
import EmployeeDetailPage from "@/pages/hr/detail/page";
import NewEmployeePage from "@/pages/hr/new/page";
import AttendancePage from "@/pages/hr/attendance/page";
import PayrollPage from "@/pages/hr/payroll/page";
import PayrollDetailPage from "@/pages/hr/payroll/detail/page";
import LeavesPage from "@/pages/hr/leaves/page";
import CrmPage from "@/pages/crm/page";
import ClientDetailPage from "@/pages/crm/detail/page";
import NewClientPage from "@/pages/crm/new/page";
import MaintenanceListPage from "@/pages/crm/maintenance/page";
import MaintenanceDetailPage from "@/pages/crm/maintenance/detail/page";
import NewMaintenancePage from "@/pages/crm/maintenance/new/page";
import SuppliersPage from "@/pages/suppliers/page";
import NewSupplierPage from "@/pages/suppliers/new/page";
import SupplierDetailPage from "@/pages/suppliers/detail/page";
import PurchaseOrdersPage from "@/pages/suppliers/orders/page";
import NewPurchaseOrderPage from "@/pages/suppliers/orders/new/page";
import PurchaseOrderDetailPage from "@/pages/suppliers/orders/detail/page";
import ReportsPage from "@/pages/reports/page";
import SalesReportsPage from "@/pages/reports/sales/page";
import InventoryReportsPage from "@/pages/reports/inventory/page";
import ProfitReportsPage from "@/pages/reports/profits/page";
import OwnerDashboardPage from "@/pages/owner/page";
import AdminUsersPage from "@/pages/admin/users/page";
import AdminAuditLogPage from "@/pages/admin/audit-log/page";
import AdminSettingsPage from "@/pages/admin/settings/page";
import AdminBackupPage from "@/pages/admin/backup/page";
import TasksPage from "@/pages/tasks/page";
import NotificationsPage from "@/pages/notifications/page";
import DocsPage from "@/pages/docs/page";

const routes: RouteObject[] = [
  {
    path: "/docs",
    element: <DocsPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/2fa",
    element: <TwoFactorPage />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/owner",
    element: (
      <AuthGuard allowedRoles={["super_admin", "owner"]}>
        <AppShell>
          <OwnerDashboardPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/billing",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <BillingPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/billing/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewInvoicePage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/billing/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <InvoiceDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/inventory",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <InventoryPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/inventory/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewInventoryItemPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/inventory/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <InventoryDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <HrPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewEmployeePage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/attendance",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <AttendancePage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/payroll",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <PayrollPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/leaves",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <LeavesPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/payroll/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <PayrollDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/hr/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <EmployeeDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/tasks",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <TasksPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/notifications",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NotificationsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <CrmPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewClientPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm/maintenance",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <MaintenanceListPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm/maintenance/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewMaintenancePage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm/maintenance/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <MaintenanceDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/crm/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <ClientDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <SuppliersPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewSupplierPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers/orders",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <PurchaseOrdersPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers/orders/new",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <NewPurchaseOrderPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers/orders/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <PurchaseOrderDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/suppliers/:id",
    element: (
      <AuthGuard allowedRoles={["super_admin", "branch_engineer"]}>
        <AppShell>
          <SupplierDetailPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/reports",
    element: (
      <AuthGuard allowedRoles={["super_admin", "owner", "branch_engineer"]}>
        <AppShell>
          <ReportsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/reports/sales",
    element: (
      <AuthGuard allowedRoles={["super_admin", "owner", "branch_engineer"]}>
        <AppShell>
          <SalesReportsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/reports/inventory",
    element: (
      <AuthGuard allowedRoles={["super_admin", "owner", "branch_engineer"]}>
        <AppShell>
          <InventoryReportsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/reports/profits",
    element: (
      <AuthGuard allowedRoles={["super_admin", "owner", "branch_engineer"]}>
        <AppShell>
          <ProfitReportsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AppShell>
          <AdminUsersPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/admin/audit-log",
    element: (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AppShell>
          <AdminAuditLogPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AppShell>
          <AdminSettingsPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "/admin/backup",
    element: (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AppShell>
          <AdminBackupPage />
        </AppShell>
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;