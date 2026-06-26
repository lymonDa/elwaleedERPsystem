import type { Employee, Attendance, MonthlyPayroll, PayrollItem, EmployeeLeave } from '@/types/supabase';

export const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    profile_id: null,
    branch_id: null,
    position: 'مهندس تبريد وتكييف أول',
    base_salary: 12000,
    hire_date: '2021-03-15',
    status: 'active',
    emergency_contact: '01001112233 - والدة الموظف',
    notes: 'مهندس متميز - حاصل على شهادة ASHRAE',
    created_at: '2021-03-15T08:00:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 'emp-002',
    profile_id: null,
    branch_id: null,
    position: 'فني تركيب تكييفات',
    base_salary: 7000,
    hire_date: '2022-01-10',
    status: 'active',
    emergency_contact: '01223334455 - زوجة الموظف',
    notes: 'متخصص في تركيب أجهزة السبلت والمركزي',
    created_at: '2022-01-10T09:00:00Z',
    updated_at: '2026-06-22T14:00:00Z',
  },
  {
    id: 'emp-003',
    profile_id: null,
    branch_id: null,
    position: 'فني صيانة',
    base_salary: 6500,
    hire_date: '2022-06-01',
    status: 'active',
    emergency_contact: '01115556677 - والد الموظف',
    notes: 'خبرة في صيانة جميع أنواع التكييفات',
    created_at: '2022-06-01T08:30:00Z',
    updated_at: '2026-06-25T09:00:00Z',
  },
  {
    id: 'emp-004',
    profile_id: null,
    branch_id: null,
    position: 'مهندس تبريد وتكييف',
    base_salary: 9000,
    hire_date: '2023-02-01',
    status: 'active',
    emergency_contact: '01009998877 - شقيق الموظف',
    notes: 'مسؤول عن مشاريع الصيانة الكبرى',
    created_at: '2023-02-01T10:00:00Z',
    updated_at: '2026-06-18T11:00:00Z',
  },
  {
    id: 'emp-005',
    profile_id: null,
    branch_id: null,
    position: 'محاسب',
    base_salary: 8000,
    hire_date: '2021-09-01',
    status: 'active',
    emergency_contact: '01227778899 - زوج الموظفة',
    notes: 'مسؤولة عن حسابات العملاء والفواتير',
    created_at: '2021-09-01T08:00:00Z',
    updated_at: '2026-06-24T12:00:00Z',
  },
  {
    id: 'emp-006',
    profile_id: null,
    branch_id: null,
    position: 'فني كهرباء تكييف',
    base_salary: 6000,
    hire_date: '2023-05-15',
    status: 'active',
    emergency_contact: '01554443322 - والدة الموظف',
    notes: 'متخصص في لوحات التحكم والكارتات الإلكترونية',
    created_at: '2023-05-15T09:00:00Z',
    updated_at: '2026-06-23T15:00:00Z',
  },
  {
    id: 'emp-007',
    profile_id: null,
    branch_id: null,
    position: 'فني تركيب وصيانة',
    base_salary: 5500,
    hire_date: '2023-08-01',
    status: 'active',
    emergency_contact: '01118889900 - شقيق الموظف',
    notes: null,
    created_at: '2023-08-01T08:00:00Z',
    updated_at: '2026-06-21T10:00:00Z',
  },
  {
    id: 'emp-008',
    profile_id: null,
    branch_id: null,
    position: 'سائق ومندوب توصيل',
    base_salary: 5000,
    hire_date: '2024-01-15',
    status: 'active',
    emergency_contact: '01012223344 - زوجة الموظف',
    notes: 'مسؤول عن توصيل الفنيين والقطع للمواقع',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2026-06-22T08:00:00Z',
  },
  {
    id: 'emp-009',
    profile_id: null,
    branch_id: null,
    position: 'أمين مخزن',
    base_salary: 5500,
    hire_date: '2022-11-01',
    status: 'active',
    emergency_contact: '01225556677 - والد الموظف',
    notes: 'مسؤول عن جرد المخزون وإدارة الأصناف',
    created_at: '2022-11-01T08:00:00Z',
    updated_at: '2026-06-24T16:00:00Z',
  },
  {
    id: 'emp-010',
    profile_id: null,
    branch_id: null,
    position: 'مهندس مبيعات',
    base_salary: 10000,
    hire_date: '2023-03-01',
    status: 'active',
    emergency_contact: '01119990088 - والد الموظف', 
    notes: 'مسؤول عن تسويق خدمات التركيب والصيانة',
    created_at: '2023-03-01T10:00:00Z',
    updated_at: '2026-06-20T14:00:00Z',
  },
  {
    id: 'emp-011',
    profile_id: null,
    branch_id: null,
    position: 'فني تركيب تكييفات',
    base_salary: 6000,
    hire_date: '2024-06-01',
    status: 'inactive',
    emergency_contact: '01224445566 - زوجة الموظف',
    notes: 'إجازة بدون مرتب لمدة 3 شهور',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'emp-012',
    profile_id: null,
    branch_id: null,
    position: 'مساعد إداري',
    base_salary: 4500,
    hire_date: '2025-01-15',
    status: 'terminated',
    emergency_contact: '01556667788 - والدة الموظف',
    notes: 'تم إنهاء الخدمة بتاريخ 2026-01-31',
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2026-01-31T14:00:00Z',
  },
];

function generateAttendanceForEmployee(employeeId: string, startDay: number): Attendance[] {
  const records: Attendance[] = [];
  const baseDate = new Date(2026, 5, startDay);
  
  for (let d = 0; d < 26; d++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + d);
    if (date.getDay() === 5) continue; // Friday off
    
    const dateStr = date.toISOString().split('T')[0];
    const random = Math.random();
    
    if (random < 0.08) {
      records.push({
        id: `att-${employeeId}-${dateStr}`,
        employee_id: employeeId,
        attendance_date: dateStr,
        check_in: null,
        check_out: null,
        status: 'absent',
        check_in_lat: null,
        check_in_lng: null,
        check_out_lat: null,
        check_out_lng: null,
        notes: 'غياب بدون إذن',
        created_at: `${dateStr}T18:00:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
      });
    } else if (random < 0.20) {
      const lateMin = Math.floor(Math.random() * 45) + 15;
      const inH = 8 + Math.floor(lateMin / 60);
      const inM = lateMin % 60;
      records.push({
        id: `att-${employeeId}-${dateStr}`,
        employee_id: employeeId,
        attendance_date: dateStr,
        check_in: `${String(inH).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00`,
        check_out: '17:00:00',
        status: 'late',
        check_in_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_in_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        check_out_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_out_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        notes: `تأخير ${lateMin} دقيقة`,
        created_at: `${dateStr}T18:00:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
      });
    } else if (random < 0.25) {
      records.push({
        id: `att-${employeeId}-${dateStr}`,
        employee_id: employeeId,
        attendance_date: dateStr,
        check_in: '08:00:00',
        check_out: '13:00:00',
        status: 'half_day',
        check_in_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_in_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        check_out_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_out_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        notes: 'نصف يوم - ظروف طارئة',
        created_at: `${dateStr}T18:00:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
      });
    } else {
      records.push({
        id: `att-${employeeId}-${dateStr}`,
        employee_id: employeeId,
        attendance_date: dateStr,
        check_in: '08:00:00',
        check_out: '17:00:00',
        status: 'present',
        check_in_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_in_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        check_out_lat: 30.7865 + (Math.random() - 0.5) * 0.01,
        check_out_lng: 31.0003 + (Math.random() - 0.5) * 0.01,
        notes: null,
        created_at: `${dateStr}T18:00:00Z`,
        updated_at: `${dateStr}T18:00:00Z`,
      });
    }
  }
  return records;
}

export const mockAttendance: Attendance[] = [
  ...generateAttendanceForEmployee('emp-001', 1),
  ...generateAttendanceForEmployee('emp-002', 1),
  ...generateAttendanceForEmployee('emp-003', 1),
  ...generateAttendanceForEmployee('emp-004', 1),
  ...generateAttendanceForEmployee('emp-005', 1),
  ...generateAttendanceForEmployee('emp-006', 1),
  ...generateAttendanceForEmployee('emp-007', 1),
  ...generateAttendanceForEmployee('emp-008', 1),
  ...generateAttendanceForEmployee('emp-009', 1),
  ...generateAttendanceForEmployee('emp-010', 1),
];

const payrollMonths = [
  { month: 1, year: 2026 },
  { month: 2, year: 2026 },
  { month: 3, year: 2026 },
  { month: 4, year: 2026 },
  { month: 5, year: 2026 },
  { month: 6, year: 2026 },
];

const bonusDescriptions: string[] = [
  'مكافأة أداء',
  'بدل مواصلات',
  'عمولة مبيعات',
  'بدل وردية إضافية',
  'مكافأة مشروع',
];

const deductionDescriptions: string[] = [
  'خصم تأخير',
  'خصم غياب',
  'سلفة مستردة',
  'تأمينات اجتماعية',
  'خصم جزاءات',
];

function generatePayrollForEmployee(emp: Employee): MonthlyPayroll[] {
  const records: MonthlyPayroll[] = [];
  
  for (const pm of payrollMonths) {
    const hasBonus = Math.random() > 0.3;
    const hasDeduction = Math.random() > 0.5;
    const bonusAmount = hasBonus ? Math.round(Math.random() * 1500 + 300) : 0;
    const deductionAmount = hasDeduction ? Math.round(Math.random() * 800 + 100) : 0;
    const netSalary = emp.base_salary + bonusAmount - deductionAmount;
    
    let status = 'paid';
    if (pm.month === 6 && pm.year === 2026) status = 'pending';
    
    records.push({
      id: `pay-${emp.id}-${pm.year}-${pm.month}`,
      employee_id: emp.id,
      month: pm.month,
      year: pm.year,
      base_salary: emp.base_salary,
      total_deductions: deductionAmount,
      total_bonuses: bonusAmount,
      net_salary: netSalary,
      status,
      notes: pm.month === 6 ? 'قيد المراجعة' : null,
      created_by: null,
      created_at: `${pm.year}-${String(pm.month).padStart(2, '0')}-01T10:00:00Z`,
      updated_at: `${pm.year}-${String(pm.month).padStart(2, '0')}-01T10:00:00Z`,
    });
  }
  return records;
}

export const mockPayrolls: MonthlyPayroll[] = [];
for (const emp of mockEmployees) {
  if (emp.status === 'active') {
    mockPayrolls.push(...generatePayrollForEmployee(emp));
  }
}

export const mockPayrollItems: PayrollItem[] = [];

for (const payroll of mockPayrolls) {
  let itemIndex = 1;
  if (payroll.total_bonuses > 0) {
    mockPayrollItems.push({
      id: `pi-${payroll.id}-${itemIndex}`,
      payroll_id: payroll.id,
      item_type: 'bonus',
      amount: payroll.total_bonuses,
      reason: bonusDescriptions[Math.floor(Math.random() * bonusDescriptions.length)],
      created_at: payroll.created_at,
    });
    itemIndex++;
  }
  if (payroll.total_deductions > 0) {
    mockPayrollItems.push({
      id: `pi-${payroll.id}-${itemIndex}`,
      payroll_id: payroll.id,
      item_type: 'deduction',
      amount: payroll.total_deductions,
      reason: deductionDescriptions[Math.floor(Math.random() * deductionDescriptions.length)],
      created_at: payroll.created_at,
    });
    itemIndex++;
  }
}

export const mockLeaves: EmployeeLeave[] = [
  {
    id: 'leave-001',
    employee_id: 'emp-001',
    leave_type: 'annual',
    start_date: '2026-07-01',
    end_date: '2026-07-10',
    total_days: 10,
    reason: 'إجازة سنوية - سفر للخارج',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-20T10:00:00Z',
    notes: 'تم الاعتماد - الموظف يستحق 21 يوم إجازة سنوية',
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 'leave-002',
    employee_id: 'emp-003',
    leave_type: 'sick',
    start_date: '2026-06-22',
    end_date: '2026-06-25',
    total_days: 4,
    reason: 'إصابة في الظهر - تقرير طبي مرفق',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-22T11:00:00Z',
    notes: null,
    created_at: '2026-06-21T14:00:00Z',
    updated_at: '2026-06-22T11:00:00Z',
  },
  {
    id: 'leave-003',
    employee_id: 'emp-005',
    leave_type: 'annual',
    start_date: '2026-06-26',
    end_date: '2026-06-28',
    total_days: 3,
    reason: 'مناسبة عائلية - زفاف شقيق',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-23T09:00:00Z',
    notes: null,
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-23T09:00:00Z',
  },
  {
    id: 'leave-004',
    employee_id: 'emp-008',
    leave_type: 'emergency',
    start_date: '2026-06-20',
    end_date: '2026-06-20',
    total_days: 1,
    reason: 'ظرف طارئ - حادث سيارة بسيط',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-20T10:00:00Z',
    notes: 'تمت الموافقة فوراً',
    created_at: '2026-06-20T09:30:00Z',
    updated_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 'leave-005',
    employee_id: 'emp-007',
    leave_type: 'annual',
    start_date: '2026-07-15',
    end_date: '2026-07-22',
    total_days: 8,
    reason: 'إجازة سنوية - زيارة أهل في الصعيد',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    notes: null,
    created_at: '2026-06-25T10:00:00Z',
    updated_at: '2026-06-25T10:00:00Z',
  },
  {
    id: 'leave-006',
    employee_id: 'emp-002',
    leave_type: 'unpaid',
    start_date: '2026-06-10',
    end_date: '2026-06-12',
    total_days: 3,
    reason: 'ظروف شخصية - بدون مرتب',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-08T14:00:00Z',
    notes: 'تم خصم 3 أيام من الراتب',
    created_at: '2026-06-05T11:00:00Z',
    updated_at: '2026-06-08T14:00:00Z',
  },
  {
    id: 'leave-007',
    employee_id: 'emp-006',
    leave_type: 'sick',
    start_date: '2026-06-15',
    end_date: '2026-06-16',
    total_days: 2,
    reason: 'نزلة برد شديدة',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-15T08:00:00Z',
    notes: null,
    created_at: '2026-06-14T20:00:00Z',
    updated_at: '2026-06-15T08:00:00Z',
  },
  {
    id: 'leave-008',
    employee_id: 'emp-010',
    leave_type: 'annual',
    start_date: '2026-08-01',
    end_date: '2026-08-15',
    total_days: 15,
    reason: 'إجازة سنوية - عمرة',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    notes: 'طلب إجازة ممتدة - يحتاج مراجعة',
    created_at: '2026-06-24T15:00:00Z',
    updated_at: '2026-06-24T15:00:00Z',
  },
  {
    id: 'leave-009',
    employee_id: 'emp-004',
    leave_type: 'emergency',
    start_date: '2026-06-18',
    end_date: '2026-06-19',
    total_days: 2,
    reason: 'حالة طوارئ عائلية - والد في المستشفى',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-06-18T07:30:00Z',
    notes: 'تمت الموافقة بشكل استثنائي',
    created_at: '2026-06-18T07:00:00Z',
    updated_at: '2026-06-18T07:30:00Z',
  },
  {
    id: 'leave-010',
    employee_id: 'emp-009',
    leave_type: 'sick',
    start_date: '2026-07-05',
    end_date: '2026-07-06',
    total_days: 2,
    reason: 'موعد عملية جراحية بسيطة',
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    notes: null,
    created_at: '2026-06-24T09:00:00Z',
    updated_at: '2026-06-24T09:00:00Z',
  },
  {
    id: 'leave-011',
    employee_id: 'emp-011',
    leave_type: 'unpaid',
    start_date: '2026-06-01',
    end_date: '2026-08-31',
    total_days: 92,
    reason: 'إجازة بدون مرتب - سفر للخارج',
    status: 'approved',
    reviewed_by: null,
    reviewed_at: '2026-05-25T10:00:00Z',
    notes: 'إجازة طويلة بدون مرتب - تم تغيير الحالة إلى inactive',
    created_at: '2026-05-20T14:00:00Z',
    updated_at: '2026-05-25T10:00:00Z',
  },
];

export const employeeNames: Record<string, string> = {
  'emp-001': 'محمود السيد عبد العزيز',
  'emp-002': 'أحمد فتحي محمد',
  'emp-003': 'إبراهيم خالد السيد',
  'emp-004': 'عمرو صلاح الدين',
  'emp-005': 'منى محمود إبراهيم',
  'emp-006': 'مصطفى جمال عبد الله',
  'emp-007': 'حسن علي محمد',
  'emp-008': 'محمد سعيد عبد الرحمن',
  'emp-009': 'يوسف أحمد حسن',
  'emp-010': 'خالد محمود فؤاد',
  'emp-011': 'طارق نبيل سامي',
  'emp-012': 'أميرة حسن عبد الفتاح',
};

export const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  terminated: 'منهي الخدمة',
};

export const attendanceStatusLabels: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  half_day: 'نصف يوم',
};

export const leaveTypeLabels: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  unpaid: 'بدون راتب',
  emergency: 'طارئة',
  maternity: 'وضع',
};

export const leaveStatusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
  cancelled: 'ملغاة',
};

export const payrollStatusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  approved: 'معتمدة',
  paid: 'مدفوعة',
};