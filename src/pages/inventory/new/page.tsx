import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@/components/base/Button';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
}

export default function NewInventoryItemPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('وحدة');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('1');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const unitOptions = ['وحدة', 'قطعة', 'لفة', 'أسطوانة', 'جالون', 'طقم', 'متر', 'كجم'];

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error: fnError } = await supabase.functions.invoke('get-inventory-categories', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (fnError) throw fnError;
      if (data?.categories) setCategories(data.categories);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('اسم الصنف مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('انتهت الجلسة، الرجاء تسجيل الدخول مرة أخرى');
        return;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke('create-inventory-item', {
        body: {
          name,
          category_id: categoryId || null,
          unit,
          quantity: parseInt(quantity) || 0,
          min_quantity: parseInt(minQuantity) || 0,
          cost_price: costPrice || null,
          selling_price: sellingPrice || null,
          serial_number: serialNumber || null,
          description: description || null,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      navigate('/inventory');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء الصنف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/inventory')}
          className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-line" />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">صنف جديد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إضافة صنف جديد للمخزون</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
          <i className="ri-error-warning-line text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Basic info */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-information-line text-foreground-400" />
            <h3 className="text-sm font-semibold text-foreground-900">البيانات الأساسية</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                اسم الصنف <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: تكييف سبليت 2.25 حصان - شارب"
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">اختر التصنيف...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">الرقم التسلسلي / الكود</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SH-225-INV-2026"
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                الوحدة <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">الوصف</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="وصف مختصر للصنف..."
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Stock & pricing */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-money-dollar-circle-line text-foreground-400" />
            <h3 className="text-sm font-semibold text-foreground-900">المخزون والتسعير</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">الكمية الأولية</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">الحد الأدنى للتنبيه</label>
              <input
                type="number"
                min="0"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">سعر التكلفة (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-800 mb-1.5">سعر البيع (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Quick profit preview */}
          {costPrice && sellingPrice && Number(costPrice) > 0 && Number(sellingPrice) > 0 && (
            <div className="mt-4 p-3 bg-background-100 rounded-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <i className="ri-line-chart-line text-green-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">هامش الربح المتوقع</p>
                <p className="text-sm font-semibold text-green-600">
                  +{Math.round(((Number(sellingPrice) - Number(costPrice)) / Number(costPrice)) * 100)}%
                  {' '}
                  <span className="text-foreground-500 text-xs font-normal">
                    ({Number(sellingPrice) - Number(costPrice)} ج.م لكل {unit})
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Link to="/inventory">
            <Button type="button" variant="ghost" disabled={submitting}>إلغاء</Button>
          </Link>
          <Button type="submit" variant="secondary" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-300 border-t-background-50 rounded-full animate-spin" />
                جاري الحفظ...
              </span>
            ) : 'حفظ الصنف'}
          </Button>
        </div>
      </form>
    </div>
  );
}