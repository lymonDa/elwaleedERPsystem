import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

export default function NewClientPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<string>('individual');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'الاسم مطلوب';
    if (!phone.trim()) errs.phone = 'رقم الهاتف مطلوب';
    else if (!/^[\d\s\-+()]{7,20}$/.test(phone.trim())) errs.phone = 'رقم هاتف غير صالح';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'بريد إلكتروني غير صالح';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    navigate('/crm');
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/crm')}
          className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line text-lg" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">عميل جديد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إضافة جهة اتصال جديدة إلى النظام</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
        <div className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">
              الاسم <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="الاسم الكامل أو اسم الشركة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">نوع العميل</label>
            <div className="flex gap-2">
              {[
                { value: 'individual', label: 'فرد', icon: 'ri-user-line' },
                { value: 'company', label: 'شركة', icon: 'ri-building-2-line' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                    type === opt.value
                      ? 'bg-primary-100 text-primary-800 border border-primary-300 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700'
                      : 'bg-background-100 text-foreground-600 border border-background-200/70 hover:bg-background-200'
                  }`}
                >
                  <i className={`${opt.icon} text-base`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground-700">
                رقم الهاتف <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                icon={<i className="ri-phone-line" />}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground-700">البريد الإلكتروني</label>
              <Input
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<i className="ri-mail-line" />}
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">العنوان</label>
            <Input
              placeholder="العنوان التفصيلي"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              icon={<i className="ri-map-pin-line" />}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">ملاحظات</label>
            <textarea
              placeholder="أي ملاحظات إضافية عن العميل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-md border border-background-200/70 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors resize-none"
            />
            <p className="text-xs text-foreground-400 text-left">{notes.length}/500</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={() => navigate('/crm')}
          className="whitespace-nowrap px-4 py-2.5 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-200 rounded-md transition-colors cursor-pointer"
        >
          إلغاء
        </button>
        <Button onClick={handleSave} loading={saving} icon={<i className="ri-save-line" />}>
          حفظ العميل
        </Button>
      </div>
    </div>
  );
}