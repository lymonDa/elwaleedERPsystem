import { useState, useMemo, useEffect, useCallback } from 'react';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import TaskCard from './components/TaskCard';
import TaskDetailModal from './components/TaskDetailModal';
import CreateTaskModal from './components/CreateTaskModal';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Task } from '@/types/supabase';

type ViewMode = 'kanban' | 'list';
type BranchFilter = 'all' | 'branch-tanta' | 'branch-alahyaa' | 'branch-almadaris';

const kanbanColumns: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];

const columnIcons: Record<string, string> = {
  todo: 'ri-inbox-line',
  in_progress: 'ri-loader-4-line',
  review: 'ri-eye-line',
  done: 'ri-check-double-line',
};

const taskStatusLabels: Record<string, string> = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  review: 'قيد المراجعة',
  done: 'مكتملة',
};

const taskPriorityLabels: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const taskPriorityVariant: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  urgent: 'danger',
};

const taskStatusVariant: Record<string, 'neutral' | 'primary' | 'accent' | 'secondary' | 'warning' | 'danger' | 'success'> = {
  todo: 'neutral',
  in_progress: 'primary',
  review: 'accent',
  done: 'secondary',
};

const branchNames: Record<string, string> = {
  'branch-tanta': 'طنطا',
  'branch-alahyaa': 'الأحياء',
  'branch-almadaris': 'المدارس',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [branchFilter, setBranchFilter] = useState<BranchFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = { page: 1, page_size: 100 };
      if (searchQuery.trim()) payload.search = searchQuery.trim();
      if (branchFilter !== 'all') payload.branch_id = branchFilter;

      const { data, error: fnError } = await supabase.functions.invoke('get-tasks', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setTasks(data?.tasks || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل المهام');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, branchFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (branchFilter !== 'all') {
      result = result.filter((t) => t.branch_id === branchFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [tasks, branchFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done',
    ).length;
    return { total, todo, inProgress, done, overdue };
  }, [tasks]);

  // Group by status for Kanban
  const kanbanGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    filteredTasks.forEach((t) => {
      if (groups[t.status]) groups[t.status].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : t.completed_at,
          updated_at: new Date().toISOString(),
        };
      }),
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : prev.completed_at,
              updated_at: new Date().toISOString(),
            }
          : null,
      );
    }

    if (task) {
      addNotification({
        user_id: task.assigned_to || 'user-super-admin',
        title: `تغيير حالة مهمة: ${task.title}`,
        message: `تم تغيير حالة المهمة "${task.title}" من "${taskStatusLabels[task.status]}" إلى "${taskStatusLabels[newStatus]}".`,
        type: 'task_status_changed',
        is_read: false,
        link: '/tasks',
      });
    }
  };

  const handleCreateTask = (newTaskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-new-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

    const branchLabel = newTaskData.branch_id ? branchNames[newTaskData.branch_id] || '' : '';
    addNotification({
      user_id: newTaskData.assigned_to || 'user-super-admin',
      title: 'مهمة جديدة مسندة إليك',
      message: `تم تعيين مهمة "${newTaskData.title}" لك${branchLabel ? ` في فرع ${branchLabel}` : ''}. الأولوية: ${taskPriorityLabels[newTaskData.priority]}.${newTaskData.due_date ? ` تاريخ التسليم: ${new Date(newTaskData.due_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}.` : ''}`,
      type: 'task_assigned',
      is_read: false,
      link: '/tasks',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">المهام والمتابعة</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إدارة ومتابعة مهام الفروع</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          icon={<i className="ri-add-line" />}
        >
          مهمة جديدة
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          title="إجمالي المهام"
          value={stats.total}
          icon="ri-task-line"
          variant="primary"
        />
        <StatCard
          title="قيد الانتظار"
          value={stats.todo}
          icon="ri-inbox-line"
          variant="secondary"
        />
        <StatCard
          title="قيد التنفيذ"
          value={stats.inProgress}
          icon="ri-loader-4-line"
          variant="accent"
        />
        <StatCard
          title="مكتملة"
          value={stats.done}
          icon="ri-check-double-line"
          variant="primary"
        />
        <StatCard
          title="متأخرة"
          value={stats.overdue}
          icon="ri-error-warning-line"
          variant="secondary"
        />
      </div>

      {/* Filters + View toggle bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Branch filter */}
          <div className="flex items-center gap-1 bg-background-100 rounded-full p-1">
            {(
              [
                { key: 'all', label: 'الكل' },
                { key: 'branch-tanta', label: 'طنطا' },
                { key: 'branch-alahyaa', label: 'الأحياء' },
                { key: 'branch-almadaris', label: 'المدارس' },
              ] as { key: BranchFilter; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBranchFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  branchFilter === opt.key
                    ? 'bg-background-50 text-foreground-900 shadow-sm'
                    : 'text-foreground-500 hover:text-foreground-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-400">
              <i className="ri-search-line text-sm" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في المهام..."
              className="w-48 px-3 py-1.5 pr-9 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-background-100 rounded-full p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'kanban'
                ? 'bg-background-50 text-foreground-900 shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-layout-column-line" />
            </span>
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-background-50 text-foreground-900 shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-list-check-2" />
            </span>
            قائمة
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل المهام...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchTasks} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kanbanColumns.map((column) => {
                const columnTasks = kanbanGroups[column];
                return (
                  <div
                    key={column}
                    className="bg-background-100 rounded-lg p-3 flex flex-col min-h-[300px]"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 flex items-center justify-center text-foreground-500">
                          <i className={columnIcons[column]} />
                        </span>
                        <h3 className="text-sm font-bold text-foreground-800 font-heading">
                          {taskStatusLabels[column]}
                        </h3>
                      </div>
                      <span className="text-xs font-medium text-foreground-400 bg-background-200 px-2 py-0.5 rounded-full">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {columnTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-foreground-300">
                          <span className="w-10 h-10 flex items-center justify-center mb-2">
                            <i className={`${columnIcons[column]} text-2xl`} />
                          </span>
                          <p className="text-xs">لا توجد مهام</p>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-background-100 border-b border-background-200/70 text-xs font-semibold text-foreground-500">
                <div className="col-span-6 md:col-span-5">المهمة</div>
                <div className="col-span-2 hidden md:block">الفرع</div>
                <div className="col-span-1 hidden md:block">الأولوية</div>
                <div className="col-span-2 md:col-span-1">الحالة</div>
                <div className="col-span-1 hidden md:block">المسؤول</div>
                <div className="col-span-4 md:col-span-2">التسليم</div>
              </div>

              <div className="divide-y divide-background-200/70">
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-foreground-300">
                    <span className="w-12 h-12 flex items-center justify-center mb-3">
                      <i className="ri-task-line text-3xl" />
                    </span>
                    <p className="text-sm">لا توجد مهام مطابقة</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 cursor-pointer"
                      >
                        مسح البحث
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isOverdue =
                      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-background-100 transition-colors cursor-pointer items-center"
                      >
                        <div className="col-span-6 md:col-span-5 min-w-0">
                          <p className="text-sm font-medium text-foreground-900 truncate">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-foreground-400 truncate mt-0.5 hidden md:block">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="col-span-2 hidden md:block">
                          {task.branch_id && (
                            <Badge variant="secondary" className="text-xs">
                              {branchNames[task.branch_id] || task.branch_id}
                            </Badge>
                          )}
                        </div>

                        <div className="col-span-1 hidden md:block">
                          <span
                            className={`inline-flex items-center text-xs font-medium ${
                              taskPriorityVariant[task.priority] === 'danger'
                                ? 'text-red-600'
                                : taskPriorityVariant[task.priority] === 'warning'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }`}
                          >
                            {taskPriorityLabels[task.priority]}
                          </span>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                          <Badge variant={taskStatusVariant[task.status]}>
                            {taskStatusLabels[task.status]}
                          </Badge>
                        </div>

                        <div className="col-span-1 text-xs text-foreground-500 truncate hidden md:block">
                          {task.assigned_to ? 'موظف' : '—'}
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <span
                            className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-foreground-500'}`}
                          >
                            {task.due_date
                              ? new Date(task.due_date).toLocaleDateString('ar-EG', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                            {isOverdue && ' ⚠'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Summary bar */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-3 bg-background-100 rounded-lg text-xs text-foreground-500">
              <span>عرض {filteredTasks.length} مهمة</span>
              <span>•</span>
              <span>
                المكتملة: {filteredTasks.filter((t) => t.status === 'done').length}
              </span>
              <span>•</span>
              <span>
                المتأخرة:{' '}
                {
                  filteredTasks.filter(
                    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done',
                  ).length
                }
              </span>
            </div>
          )}
        </>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onStatusChange={handleStatusChange}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  );
}