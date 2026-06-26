import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { verifyTotp, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || code.trim().length !== 6) {
      setError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    const result = await verifyTotp(code.trim());

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'رمز التحقق غير صحيح');
    }
  };

  const handleBack = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
            <i className="ri-shield-check-line text-xl text-background-50" />
          </div>
          <h1 className="text-lg font-bold text-foreground-900 font-heading">
            التحقق بخطوتين
          </h1>
          <p className="text-sm text-foreground-500 mt-1">
            أدخل رمز التحقق من تطبيق المصادقة
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-background-50 border border-background-200/70 rounded-lg p-6 flex flex-col gap-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
              <i className="ri-error-warning-line ml-1" />
              {error}
            </div>
          )}

          <Input
            label="رمز التحقق"
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(val);
            }}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            icon={<i className="ri-lock-line" />}
            className="text-center text-lg tracking-[0.3em]"
          />

          <Button type="submit" loading={isLoading} className="w-full">
            تحقق
          </Button>

          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
          >
            ← العودة لتسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}