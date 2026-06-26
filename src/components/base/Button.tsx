import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-background-50 hover:bg-primary-600 focus:ring-primary-400 active:bg-primary-700 dark:text-foreground-950',
  secondary:
    'bg-secondary-500 text-background-50 hover:bg-secondary-600 focus:ring-secondary-400 active:bg-secondary-700 dark:text-foreground-950',
  accent:
    'bg-accent-500 text-background-50 hover:bg-accent-600 focus:ring-accent-400 active:bg-accent-700 dark:text-foreground-950',
  ghost:
    'bg-transparent text-foreground-700 hover:bg-background-200 focus:ring-foreground-300 active:bg-background-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 active:bg-red-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md',
  md: 'px-4 py-2 text-sm gap-2 rounded-md',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`whitespace-nowrap inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex items-center justify-center w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}