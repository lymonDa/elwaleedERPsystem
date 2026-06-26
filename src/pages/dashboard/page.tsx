import { useAuthStore } from '@/stores/authStore';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';

export default function DashboardPage() {
  const { profile, branch } = useAuthStore();
  const roleLabel = {
    super_admin: 'مدير النظام',
    owner: 'صاحب الشركة',
    branch_engineer: 'مهندس فرع',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">
          مرحباً، {profile?.full_name || 'مستخدم'}
        </h1>
        <p className="text-sm text-foreground-500 mt-1">
          {profile?.role ? roleLabel[profile.role] : ''}
          {branch && ` — ${branch.name}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الفواتير (الشهر)"
          value="٠ فاتورة"
          icon="ri-bill-line"
          variant="primary"
          trend={{ value: 0, label: 'عن الشهر الماضي' }}
        />
        <StatCard
          title="إيرادات الشهر"
          value="٠ ج.م"
          icon="ri-money-dollar-circle-line"
          variant="accent"
          trend={{ value: 0, label: 'عن الشهر الماضي' }}
        />
        <StatCard
          title="قيد الانتظار"
          value="٠ طلب"
          icon="ri-hourglass-line"
          variant="secondary"
        />
        <StatCard
          title="المهام النشطة"
          value="٠ مهمة"
          icon="ri-task-line"
          variant="primary"
        />
      </div>

      {/* Quick info */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-6">
        <h3 className="text-base font-semibold text-foreground-900 font-heading mb-3">
          حالة النظام
        </h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">متصل بقاعدة البيانات</Badge>
          <Badge variant="neutral">لا توجد فواتير بعد</Badge>
          <Badge variant="neutral">المخزون فارغ</Badge>
        </div>
        <p className="text-sm text-foreground-500 mt-4">
          لم يتم إضافة أي بيانات بعد. ابدأ بإضافة العملاء أو إنشاء أول فاتورة.
        </p>
      </div>
    </div>
  );
}