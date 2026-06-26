import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    const result = await login(email.trim(), password);

    if (result.needsTotp) {
      navigate('/2fa', { state: { from } });
    } else if (!result.error) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
            <i className="ri-building-2-line text-2xl text-background-50" />
          </div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">
            شركة الوليد للتكييفات والمقاولات
          </h1>
          <p className="text-sm text-foreground-500 mt-1">نظام الإدارة الداخلي</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground-900 font-heading">تسجيل الدخول</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
              <i className="ri-error-warning-line mr-1" />
              {error}
            </div>
          )}

          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@alwaleed.com"
            autoComplete="email"
            required
            icon={<i className="ri-mail-line" />}
          />

          <Input
            label="كلمة المرور"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            icon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-foreground-400 hover:text-foreground-600 cursor-pointer"
                tabIndex={-1}
              >
                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            }
          />

          <Button type="submit" loading={isLoading} className="w-full mt-2">
            دخول
          </Button>
        </form>

        <p className="text-center text-xs text-foreground-400 mt-6">
          © {new Date().getFullYear()} شركة الوليد للتكييفات والمقاولات
        </p>
      </div>
    </div>
  );
}