import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

export default function NewSupplierPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'اسم المورد مطلوب';
    if (!form.phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/suppliers');
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/suppliers')}
          className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line text-lg" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">مورد جديد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إضافة مورد جديد إلى النظام</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-lg p-6 space-y-5">
        <Input
          label="اسم المورد"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="أدخل اسم الشركة أو المؤسسة"
          error={errors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="جهة الاتصال"
            name="contact_person"
            value={form.contact_person}
            onChange={handleChange}
            placeholder="اسم الشخص المسؤول"
          />
          <Input
            label="رقم الهاتف"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="01xxxxxxxxx"
            error={errors.phone}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@domain.com"
            error={errors.email}
          />
          <Input
            label="العنوان"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="العنوان التفصيلي"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-foreground-800">
            ملاحظات
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            placeholder="ملاحظات إضافية عن المورد..."
            className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
          />
          <p className="text-xs text-foreground-400">{form.notes.length}/500</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} icon={<i className="ri-save-line" />}>
            حفظ المورد
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/suppliers')}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}