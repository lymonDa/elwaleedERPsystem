import { useState } from 'react';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import { employeeNames } from '@/mocks/employees';
import { branchNames } from '@/mocks/tasks';
import type { Task } from '@/types/supabase';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

const branchOptions = [
  { id: 'branch-tanta', name: 'طنطا' },
  { id: 'branch-alahyaa', name: 'الأحياء' },
  { id: 'branch-almadaris', name: 'المدارس' },
];

const employeeOptions = [
  { id: 'emp-001', name: 'محمود السيد (مهندس أول)' },
  { id: 'emp-002', name: 'أحمد فتحي (فني تركيب)' },
  { id: 'emp-003', name: 'إبراهيم خالد (فني صيانة)' },
  { id: 'emp-004', name: 'عمرو صلاح (مهندس)' },
  { id: 'emp-005', name: 'منى محمود (محاسب)' },
  { id: 'emp-006', name: 'مصطفى جمال (فني كهرباء)' },
  { id: 'emp-007', name: 'حسن علي (فني تركيب)' },
  { id: 'emp-008', name: 'محمد سعيد (سائق)' },
  { id: 'emp-009', name: 'يوسف أحمد (أمين مخزن)' },
  { id: 'emp-010', name: 'خالد محمود (مهندس مبيعات)' },
];

export default function CreateTaskModal({ open, onClose, onCreate }: CreateTaskModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    branch_id: 'branch-tanta',
    assigned_to: '',
    priority: 'medium' as Task['priority'],
    due_date: '',
  });

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      branch_id: 'branch-tanta',
      assigned_to: '',
      priority: 'medium',
      due_date: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onCreate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      branch_id: form.branch_id,
      assigned_to: form.assigned_to || null,
      created_by: 'user-super-admin',
      status: 'todo',
      priority: form.priority,
      due_date: form.due_date || null,
      completed_at: null,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="مهمة جديدة" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground-800">عنوان المهمة *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="أدخل عنوان المهمة"
            required
            className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground-800">الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="أدخل وصف المهمة..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
          />
        </div>

        {/* Branch + Priority row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الفرع</label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
            >
              {branchOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الأولوية</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task['priority'] })}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
          </div>
        </div>

        {/* Assignee + Due Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">تعيين إلى</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
            >
              <option value="">بدون تعيين</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">تاريخ التسليم</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={!form.title.trim()}>
            إنشاء المهمة
          </Button>
        </div>
      </form>
    </Modal>
  );
}