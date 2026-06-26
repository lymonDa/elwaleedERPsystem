import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import { mockClients } from '@/mocks/clients';
import { mockEmployees } from '@/mocks/employees';

export default function NewMaintenancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('client') || '';

  const [clientId, setClientId] = useState(preselectedClientId);
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return mockClients.slice(0, 6);
    const q = clientSearch.trim().toLowerCase();
    return mockClients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [clientSearch]);

  const selectedClient = useMemo(() => mockClients.find((c) => c.id === clientId), [clientId]);

  const techEmployees = useMemo(
    () => mockEmployees.filter((e) => e.status === 'active' && (e.position.includes('مهندس') || e.position.includes('فني'))),
    []
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = 'العميل مطلوب';
    if (!description.trim()) errs.description = 'وصف الطلب مطلوب';
    else if (description.trim().length < 10) errs.description = 'الوصف قصير جداً (أقل من 10 أحرف)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    navigate('/crm/maintenance');
  };

  useEffect(() => {
    if (preselectedClientId) {
      const client = mockClients.find((c) => c.id === preselectedClientId);
      if (client) setClientSearch(client.name);
    }
  }, [preselectedClientId]);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/crm/maintenance')}
          className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line text-lg" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">طلب صيانة جديد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إنشاء طلب صيانة أو تركيب لعميل</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
        <div className="flex flex-col gap-5">
          {/* Client */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm font-medium text-foreground-700">
              العميل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder="ابحث عن العميل بالاسم..."
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientId('');
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                error={errors.clientId}
                icon={<i className="ri-user-search-line" />}
              />
              {showClientDropdown && !selectedClient && (
                <div className="absolute top-full right-0 left-0 z-[110] mt-1 bg-background-50 border border-background-200/70 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-foreground-400">لا يوجد عملاء مطابقين</p>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientId(c.id);
                          setClientSearch(c.name);
                          setShowClientDropdown(false);
                          if (errors.clientId) setErrors((prev) => { const n = { ...prev }; delete n.clientId; return n; });
                        }}
                        className="w-full text-right px-4 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer flex items-center gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-secondary-600">{c.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate">{c.name}</p>
                          <p className="text-xs text-foreground-400">{c.phone || ''}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">
              وصف الطلب <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="صف المشكلة أو الخدمة المطلوبة بالتفصيل..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
              className={`w-full px-3 py-2 text-sm rounded-md border bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors resize-none ${
                errors.description ? 'border-red-400' : 'border-background-200/70'
              }`}
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-foreground-400">{description.length}/500</p>
            </div>
          </div>

          {/* Scheduled Date & Engineer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground-700">التاريخ المحدد</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground-700">المهندس المسؤول</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-background-200/70 bg-background-50 text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-colors cursor-pointer"
              >
                <option value="">— اختر مهندس —</option>
                {techEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.position} — {emp.id === 'emp-001' ? 'محمود السيد' : emp.id === 'emp-002' ? 'أحمد فتحي' : emp.id === 'emp-003' ? 'إبراهيم خالد' : emp.id === 'emp-004' ? 'عمرو صلاح' : emp.id === 'emp-006' ? 'مصطفى جمال' : emp.id === 'emp-007' ? 'حسن علي' : 'مهندس'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground-700">ملاحظات إضافية</label>
            <textarea
              placeholder="أي ملاحظات أو تعليمات إضافية..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
          onClick={() => navigate('/crm/maintenance')}
          className="whitespace-nowrap px-4 py-2.5 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-200 rounded-md transition-colors cursor-pointer"
        >
          إلغاء
        </button>
        <Button onClick={handleSave} loading={saving} icon={<i className="ri-save-line" />}>
          حفظ الطلب
        </Button>
      </div>
    </div>
  );
}