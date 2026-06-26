/* ─── Supabase Database Types ─── */

export type UserRole = 'super_admin' | 'owner' | 'branch_engineer' | 'technician';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PayrollStatus = 'draft' | 'approved' | 'paid' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/* ─── Database Schema ─── */

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile };
      branches: { Row: Branch };
      role_permissions: { Row: RolePermission };
      permissions: { Row: Permission };
      clients: { Row: Client };
      inventory_items: { Row: InventoryItem };
      inventory_categories: { Row: InventoryCategory };
      inventory_transactions: { Row: InventoryTransaction };
      invoices: { Row: Invoice };
      invoice_items: { Row: InvoiceItem };
      invoice_payments: { Row: InvoicePayment };
      employees: { Row: Employee };
      attendance: { Row: Attendance };
      monthly_payroll: { Row: MonthlyPayroll };
      payroll_items: { Row: PayrollItem };
      employee_leaves: { Row: EmployeeLeave };
      maintenance_requests: { Row: MaintenanceRequest };
      suppliers: { Row: Supplier };
      purchase_orders: { Row: PurchaseOrder };
      purchase_order_items: { Row: PurchaseOrderItem };
      tasks: { Row: Task };
      task_comments: { Row: TaskComment };
      notifications: { Row: Notification };
      audit_logs: { Row: AuditLog };
      system_settings: { Row: SystemSettings };
      backup_logs: { Row: BackupLog };
    };
  };
}

/* ─── Table Row Types ─── */

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  totp_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  description: string | null;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  cost_price: number;
  unit: string;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  due_date: string | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  payment_date: string;
  created_by: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string | null;
  salary: number;
  hire_date: string;
  branch_id: string | null;
  is_active: boolean;
  national_id: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'leave';
  notes: string | null;
  created_at: string;
}

export interface MonthlyPayroll {
  id: string;
  month: string;
  year: number;
  status: PayrollStatus;
  total_amount: number;
  branch_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollItem {
  id: string;
  payroll_id: string;
  employee_id: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  overtime: number;
  net_salary: number;
  notes: string | null;
  created_at: string;
}

export interface EmployeeLeave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  status: MaintenanceStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  cost: number;
  notes: string | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  contact_person: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  expected_date: string | null;
  received_date: string | null;
  branch_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  received_quantity: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  branch_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface BackupLog {
  id: string;
  filename: string;
  size: number;
  status: 'pending' | 'completed' | 'failed';
  type: string;
  created_by: string | null;
  created_at: string;
}
