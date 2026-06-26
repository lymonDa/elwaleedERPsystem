import { useState } from 'react';
import StatCard from '@/components/base/StatCard';
import { mockSystemSettings, mockProfiles } from '@/mocks/admin';

type SettingsGroup = {
  label: string;
  icon: string;
  keys: string[];
};

const settingsGroups: SettingsGroup[] = [
  {
    label: 'الإعدادات العامة',
    icon: 'ri-settings-3-line',
    keys: ['company_name', 'company_phone', 'company_address', 'default_language'],
  },
  {
    label: 'الأمان والجلسات',
    icon: 'ri-shield-check-line',
    keys: ['auto_logout_minutes', 'session_timeout_minutes', 'max_login_attempts'],
  },
  {
    label: 'النسخ الاحتياطي',
    icon: 'ri-cloud-line',
    keys: ['backup_frequency', 'backup_retention_days'],
  },
  {
    label: 'الفواتير',
    icon: 'ri-bill-line',
    keys: ['invoice_prefix', 'tax_rate', 'invoice_footer_text'],
  },
  {
    label: 'المخزون',
    icon: 'ri-archive-line',
    keys: ['low_stock_threshold'],
  },
  {
    label: 'ساعات العمل',
    icon: 'ri-time-line',
    keys: ['working_hours_start', 'working_hours_end'],
  },
  {
    label: 'الصيانة',
    icon: 'ri-tools-line',
    keys: ['maintenance_warranty_days'],
  },
];

const settingLabels: Record<string, string> = {
  company_name: 'اسم الشركة',
  company_phone: 'هاتف الشركة',
  company_address: 'عنوان الشركة',
  default_language: 'اللغة الافتراضية',
  auto_logout_minutes: 'تسجيل الخروج التلقائي (دقيقة)',
  session_timeout_minutes: 'مدة الجلسة (دقيقة)',
  max_login_attempts: 'الحد الأقصى لمحاولات الدخول',
  backup_frequency: 'تكرار النسخ الاحتياطي',
  backup_retention_days: 'مدة الاحتفاظ بالنسخ (يوم)',
  invoice_prefix: 'بادئة رقم الفاتورة',
  tax_rate: 'نسبة الضريبة (%)',
  invoice_footer_text: 'نص تذييل الفاتورة',
  low_stock_threshold: 'حد التنبيه لنفاد المخزون',
  working_hours_start: 'بداية ساعات العمل',
  working_hours_end: 'نهاية ساعات العمل',
  maintenance_warranty_days: 'مدة ضمان الصيانة (يوم)',
};

export default function AdminSettingsPage() {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const getSetting = (key: string) => mockSystemSettings.find((s) => s.key === key);

  const handleEdit = (key: string) => {
    const setting = getSetting(key);
    if (setting) {
      setEditKey(key);
      setEditValue(setting.value);
    }
  };

  const handleSave = () => {
    setEditKey(null);
    setToastMsg('تم حفظ الإعدادات بنجاح');
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-[120] bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg animate-bounce">
          <i className="ri-check-line" />
          {toastMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الإعدادات" value={mockSystemSettings.length} icon="ri-settings-3-line" variant="primary" />
        <StatCard title="مجموعات الإعدادات" value={settingsGroups.length} icon="ri-folder-line" variant="accent" />
        <StatCard
          title="آخر تحديث"
          value={new Date(Math.max(...mockSystemSettings.map((s) => new Date(s.updated_at || '').getTime()))).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
          icon="ri-calendar-line"
          variant="secondary"
        />
        <StatCard title="نسخ احتياطي" value={getSetting('backup_frequency')?.value || '—'} icon="ri-cloud-line" variant="secondary" />
      </div>

      {/* Settings Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {settingsGroups.map((group) => (
          <div key={group.label} className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-background-200/70 bg-background-100/50">
              <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                <i className={`${group.icon} text-base`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground-900">{group.label}</h3>
            </div>
            <div className="divide-y divide-background-200/50">
              {group.keys.map((key) => {
                const setting = getSetting(key);
                if (!setting) return null;
                const isEditing = editKey === key;
                const lastUpdatedBy = setting.updated_by
                  ? mockProfiles.find((p) => p.id === setting.updated_by)?.full_name || '—'
                  : '—';

                return (
                  <div key={key} className="flex items-start gap-3 px-4 md:px-5 py-3.5">
                    {/* Label + Value */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground-900 whitespace-nowrap">{settingLabels[key] || key}</span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {key === 'default_language' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-3 py-1.5 text-sm bg-background-50 border border-primary-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 w-full sm:w-auto"
                            >
                              <option value="ar">العربية</option>
                              <option value="en">English</option>
                            </select>
                          ) : key === 'backup_frequency' ? (
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-3 py-1.5 text-sm bg-background-50 border border-primary-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 w-full sm:w-auto"
                            >
                              <option value="يومي">يومي</option>
                              <option value="أسبوعي">أسبوعي</option>
                              <option value="شهري">شهري</option>
                            </select>
                          ) : (
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="px-3 py-1.5 text-sm bg-background-50 border border-primary-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 w-full sm:w-48 md:w-56 lg:w-48"
                            />
                          )}
                          <button
                            onClick={handleSave}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer flex-shrink-0"
                          >
                            <i className="ri-check-line text-sm" />
                          </button>
                          <button
                            onClick={() => setEditKey(null)}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer flex-shrink-0"
                          >
                            <i className="ri-close-line text-sm" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground-500 break-words">{setting.value}</span>
                          <button
                            onClick={() => handleEdit(key)}
                            className="w-6 h-6 flex items-center justify-center rounded text-foreground-300 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer flex-shrink-0"
                          >
                            <i className="ri-edit-line text-xs" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meta (updated_at + updated_by) */}
                    <div className="hidden md:flex flex-col items-end flex-shrink-0 min-w-[80px]">
                      <span className="text-xs text-foreground-400 whitespace-nowrap">
                        {setting.updated_at
                          ? new Date(setting.updated_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </span>
                      <span className="text-xs text-foreground-300 whitespace-nowrap">{lastUpdatedBy}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}