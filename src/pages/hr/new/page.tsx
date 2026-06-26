import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    position: '',
    baseSalary: '',
    hireDate: new Date().toISOString().split('T')[0],
    emergencyContact: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('سيتم حفظ الموظف — هذه الميزة تحتاج للربط مع Supabase');
      navigate('/hr');
    }, 800);
  };

  const isValid = form.name.trim() && form.position.trim() && form.baseSalary.trim();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/hr')}
          className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">إضافة موظف جديد</h1>
          <p className="text-sm text-foreground-500 mt-1">أدخل بيانات الموظف الأساسية</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-lg p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="الاسم الكامل *"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="أدخل اسم الموظف الثلاثي"
            required
          />
          <Input
            label="المسمى الوظيفي *"
            value={form.position}
            onChange={(e) => handleChange('position', e.target.value)}
            placeholder="مثال: فني تركيب تكييفات"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="الراتب الأساسي *"
            type="number"
            value={form.baseSalary}
            onChange={(e) => handleChange('baseSalary', e.target.value)}
            placeholder="بالجنيه المصري"
            required
          />
          <Input
            label="تاريخ التعيين"
            type="date"
            value={form.hireDate}
            onChange={(e) => handleChange('hireDate', e.target.value)}
          />
        </div>

        <Input
          label="جهة اتصال الطوارئ"
          value={form.emergencyContact}
          onChange={(e) => handleChange('emergencyContact', e.target.value)}
          placeholder="الاسم ورقم الهاتف"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground-800">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="أي ملاحظات إضافية..."
            className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-2 justify-end pt-3 border-t border-background-200/70">
          <Button variant="ghost" size="sm" onClick={() => navigate('/hr')} type="button">
            إلغاء
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={saving} disabled={!isValid}>
            حفظ الموظف
          </Button>
        </div>
      </form>
    </div>
  );
}