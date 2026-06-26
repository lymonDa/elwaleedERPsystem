import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import { supabase } from '@/lib/supabase';
import type { Client, InventoryItem } from '@/types/supabase';

interface LineItem {
  id: string;
  inventory_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function NewInvoicePage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'issued'>('draft');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', item_name: '', quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0.14);

  const [showItemDropdown, setShowItemDropdown] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.from('clients').select('id, name, phone, branch_id').order('name');
      if (err) throw err;
      setClients(data || []);
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.from('inventory_items').select('id, name, unit, selling_price, quantity, branch_id').order('name');
      if (err) throw err;
      setInventoryItems(data || []);
    } catch {
      setInventoryItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchInventory();
  }, [fetchClients, fetchInventory]);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        return updated;
      }),
    );
  };

  const selectInventoryItem = (itemId: string, lineId: string) => {
    const invItem = inventoryItems.find((i) => i.id === itemId);
    if (!invItem) return;
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        return {
          ...item,
          inventory_item_id: invItem.id,
          item_name: invItem.name,
          unit_price: invItem.selling_price || 0,
          total: item.quantity * (invItem.selling_price || 0),
        };
      }),
    );
    setShowItemDropdown(null);
  };

  const addItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: String(Date.now()), item_name: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = Math.round((subtotal - discount) * taxRate * 100) / 100;
  const grandTotal = Math.round((subtotal - discount + taxAmount) * 100) / 100;

  const formatCurrency = (val: number) => `${val.toLocaleString('ar-EG')} ج.م`;

  const handleSubmit = async (e: React.FormEvent, targetStatus: 'draft' | 'issued') => {
    e.preventDefault();
    if (!clientId) {
      setError('يرجى اختيار العميل');
      return;
    }
    if (!branchId) {
      setError('يرجى اختيار الفرع');
      return;
    }
    const validItems = lineItems.filter((i) => i.item_name.trim() && i.quantity > 0 && i.unit_price >= 0);
    if (validItems.length === 0) {
      setError('يرجى إضافة بند واحد على الأقل');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('يرجى تسجيل الدخول');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-invoice', {
        body: {
          client_id: clientId,
          branch_id: branchId,
          status: targetStatus,
          items: validItems.map((i) => ({
            inventory_item_id: i.inventory_item_id,
            item_name: i.item_name.trim(),
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
          notes: notes.trim() || undefined,
          due_date: dueDate || undefined,
          discount_amount: discount,
          tax_rate: taxRate,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      navigate('/billing');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  const branches = [
    { id: '92329ba6-8ac4-4e78-bcb0-eec1ee4b8ab5', name: 'طنطا' },
    { id: '48759753-ba27-408f-93c1-9a77d1629954', name: 'الأحياء' },
    { id: 'b23e9280-c0c6-4ac4-9703-684f31b9d0b9', name: 'المدارس' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/billing')}
          className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">فاتورة جديدة</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إنشاء فاتورة جديدة</p>
        </div>
      </div>

      <form className="flex flex-col gap-5">
        {/* Client + Branch */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground-800">العميل *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="">اختر العميل...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {clientsLoading && <p className="text-xs text-foreground-400">جاري تحميل العملاء...</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground-800">الفرع *</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value="">اختر الفرع...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground-800">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-foreground-800 mb-1 block">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية (اختياري)"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-background-200/70 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground-900">بنود الفاتورة</h3>
            <Button type="button" variant="ghost" size="sm" icon={<i className="ri-add-line" />} onClick={addItem}>
              إضافة بند
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 w-10">#</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">الصنف</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 w-24">الكمية</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 w-36">سعر الوحدة</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 w-36">الإجمالي</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {lineItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-foreground-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-2 relative">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                          onFocus={() => setShowItemDropdown(item.id)}
                          placeholder="اسم الصنف أو الخدمة"
                          className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-background-300 focus:border-primary-400 rounded focus:outline-none text-foreground-900 placeholder:text-foreground-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowItemDropdown(showItemDropdown === item.id ? null : item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                          title="اختيار من المخزون"
                        >
                          <i className="ri-archive-line text-sm" />
                        </button>
                      </div>
                      {showItemDropdown === item.id && inventoryItems.length > 0 && (
                        <div className="absolute z-[110] mt-1 w-72 bg-background-50 border border-background-200/70 rounded-lg shadow-lg max-h-48 overflow-y-auto right-4">
                          <div className="p-2 border-b border-background-200/70 text-xs font-semibold text-foreground-500">المخزون</div>
                          {itemsLoading ? (
                            <p className="px-4 py-3 text-sm text-foreground-400">جاري التحميل...</p>
                          ) : (
                            inventoryItems.map((inv) => (
                              <button
                                key={inv.id}
                                type="button"
                                onClick={() => selectInventoryItem(inv.id, item.id)}
                                className="w-full text-right px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{inv.name}</span>
                                  <span className="text-xs text-foreground-400">{inv.selling_price?.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="text-xs text-foreground-400 mt-0.5">
                                  المخزون: {inv.quantity} | {inv.unit}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-background-300 focus:border-primary-400 rounded focus:outline-none text-foreground-900 text-center"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent hover:border-background-300 focus:border-primary-400 rounded focus:outline-none text-foreground-900 text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-foreground-900 font-medium text-right">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-2 py-2">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-foreground-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Discount + Tax + Totals */}
          <div className="border-t border-background-200/70 px-5 py-3 flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-6 items-center">
              <span className="text-foreground-500">الخصم:</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 text-sm bg-background-50 border border-background-200 rounded text-foreground-900 text-right focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="flex gap-6 items-center">
              <span className="text-foreground-500">نسبة الضريبة:</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-32 px-2 py-1 text-sm bg-background-50 border border-background-200 rounded text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
              >
                <option value={0.14}>14%</option>
                <option value={0}>0%</option>
              </select>
            </div>
            <div className="flex gap-6">
              <span className="text-foreground-500">المجموع الفرعي:</span>
              <span className="text-foreground-900">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex gap-6">
                <span className="text-foreground-500">الخصم:</span>
                <span className="text-red-600">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex gap-6">
              <span className="text-foreground-500">الضريبة ({(taxRate * 100).toFixed(0)}%):</span>
              <span className="text-foreground-900">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex gap-6 pt-2 border-t border-background-200/70 mt-1">
              <span className="font-semibold text-foreground-900">الإجمالي:</span>
              <span className="font-bold text-foreground-900 text-base">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <i className="ri-error-warning-line mr-1" /> {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Link to="/billing">
            <Button type="button" variant="ghost">إلغاء</Button>
          </Link>
          <Button
            type="button"
            variant="secondary"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
            loading={submitting && status === 'draft'}
          >
            حفظ كمسودة
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'issued')}
            loading={submitting && status === 'issued'}
            icon={<i className="ri-send-plane-line" />}
          >
            حفظ وإصدار
          </Button>
        </div>
      </form>
    </div>
  );
}