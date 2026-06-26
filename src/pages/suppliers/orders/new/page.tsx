import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import { mockSuppliers } from '@/mocks/suppliers';
import { mockItems } from '@/mocks/inventory';

interface OrderItem {
  key: string;
  item_name: string;
  inventory_item_id: string | null;
  quantity: number;
  unit_price: number;
}

export default function NewPurchaseOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplier = searchParams.get('supplier') || '';

  const [supplierId, setSupplierId] = useState(preselectedSupplier);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectedSupplier = useMemo(() => mockSuppliers.find((s) => s.id === supplierId), [supplierId]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return mockSuppliers.slice(0, 8);
    const q = supplierSearch.toLowerCase();
    return mockSuppliers.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [supplierSearch]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { key: Date.now().toString(), item_name: '', inventory_item_id: null, quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateItem = (key: string, field: keyof OrderItem, value: string | number | null) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        if (field === 'inventory_item_id' && typeof value === 'string') {
          const foundItem = mockItems.find((m) => m.id === value);
          return {
            ...i,
            inventory_item_id: value,
            item_name: foundItem ? foundItem.name : i.item_name,
            unit_price: foundItem ? (foundItem.cost_price || 0) : i.unit_price,
          };
        }
        return { ...i, [field]: value };
      })
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!supplierId) newErrors.supplier = 'يرجى اختيار المورد';
    if (items.length === 0) newErrors.items = 'يرجى إضافة بند واحد على الأقل';
    for (let idx = 0; idx < items.length; idx++) {
      if (!items[idx].item_name.trim()) {
        newErrors[`item_${idx}_name`] = 'اسم الصنف مطلوب';
      }
      if (items[idx].quantity <= 0) {
        newErrors[`item_${idx}_qty`] = 'الكمية يجب أن تكون أكبر من صفر';
      }
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
      navigate('/suppliers/orders');
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/suppliers/orders')}
          className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line text-lg" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">أمر شراء جديد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إنشاء أمر شراء من الموردين</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier & Notes */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-6 space-y-5">
          <div className="relative">
            <label className="text-sm font-medium text-foreground-800 block mb-1">المورد</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث واختر المورد..."
                value={selectedSupplier ? selectedSupplier.name : supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setSupplierId('');
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                className={`w-full px-3 py-2 text-sm bg-background-50 border rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${errors.supplier ? 'border-red-500' : 'border-foreground-200'}`}
              />
              {selectedSupplier && (
                <button
                  type="button"
                  onClick={() => { setSupplierId(''); setSupplierSearch(''); }}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-foreground-400 hover:text-foreground-600 cursor-pointer"
                >
                  <i className="ri-close-line" />
                </button>
              )}
            </div>
            {errors.supplier && <p className="text-xs text-red-600 mt-1">{errors.supplier}</p>}
            {showSupplierDropdown && !selectedSupplier && (
              <div className="absolute z-[110] mt-1 w-full bg-background-50 border border-background-200/70 rounded-md shadow-sm max-h-48 overflow-y-auto">
                {filteredSuppliers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSupplierId(s.id);
                      setSupplierSearch('');
                      setShowSupplierDropdown(false);
                    }}
                    className="w-full text-right px-3 py-2.5 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer flex items-center gap-3"
                  >
                    <span className="w-7 h-7 rounded bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary-700">{s.name.charAt(0)}</span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate">{s.name}</p>
                      <p className="text-xs text-foreground-400 truncate">{s.phone || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="po-notes" className="text-sm font-medium text-foreground-800">ملاحظات</label>
            <textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="ملاحظات على أمر الشراء..."
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground-900">البنود</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addItem} icon={<i className="ri-add-line" />}>
              إضافة بند
            </Button>
          </div>

          {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}

          {items.length === 0 ? (
            <div className="text-center py-8 text-foreground-400 text-sm border border-dashed border-background-300/60 rounded-md">
              لم تتم إضافة أي بنود بعد. اضغط "إضافة بند" للبدء.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.key} className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-background-100/50 rounded-md border border-background-200/70">
                  <div className="flex-1 w-full sm:w-auto">
                    <select
                      value={item.inventory_item_id || ''}
                      onChange={(e) => updateItem(item.key, 'inventory_item_id', e.target.value || null)}
                      className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    >
                      <option value="">— اختر من المخزون أو اكتب يدوياً —</option>
                      {mockItems.map((mi) => (
                        <option key={mi.id} value={mi.id}>
                          {mi.name}
                        </option>
                      ))}
                    </select>
                    {!item.inventory_item_id && (
                      <input
                        type="text"
                        placeholder="اسم الصنف"
                        value={item.item_name}
                        onChange={(e) => updateItem(item.key, 'item_name', e.target.value)}
                        className={`w-full mt-2 px-3 py-2 text-sm bg-background-50 border rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${errors[`item_${idx}_name`] ? 'border-red-500' : 'border-foreground-200'}`}
                      />
                    )}
                    {errors[`item_${idx}_name`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`item_${idx}_name`]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, 'quantity', parseInt(e.target.value) || 0)}
                      className={`w-20 px-2 py-2 text-sm text-center bg-background-50 border rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent ${errors[`item_${idx}_qty`] ? 'border-red-500' : 'border-foreground-200'}`}
                      placeholder="الكمية"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.key, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      placeholder="سعر الوحدة"
                    />
                    <span className="text-xs text-foreground-500 whitespace-nowrap">
                      {(item.quantity * item.unit_price).toLocaleString('ar-EG')} ج.م
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {items.length > 0 && (
            <div className="flex justify-end pt-3 border-t border-background-200/70">
              <div className="text-right">
                <p className="text-xs text-foreground-500">الإجمالي</p>
                <p className="text-xl font-bold text-foreground-900 font-heading">{subtotal.toLocaleString('ar-EG')} ج.م</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" loading={saving} icon={<i className="ri-save-line" />}>
            حفظ أمر الشراء
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/suppliers/orders')}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}