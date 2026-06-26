interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: { value: number; label: string };
  variant?: 'primary' | 'accent' | 'secondary';
}

export default function StatCard({ title, value, icon, trend, variant = 'primary' }: StatCardProps) {
  const iconBgClasses = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300',
    secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300',
  };

  return (
    <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClasses[variant]}`}>
          <i className={`${icon} text-lg`} />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs md:text-sm text-foreground-500">{title}</p>
        <p className="text-lg md:text-xl font-bold text-foreground-900 font-heading">{value}</p>
        {trend && (
          <p className={`text-xs ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}