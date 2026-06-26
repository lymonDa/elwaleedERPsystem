import { taskPriorityLabels, taskPriorityVariant, branchNames, taskStatusLabels } from '@/mocks/tasks';
import { employeeNames } from '@/mocks/employees';
import type { Task } from '@/types/supabase';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const priorityIcons: Record<string, string> = {
  low: 'ri-arrow-down-line',
  medium: 'ri-equal-line',
  high: 'ri-arrow-up-line',
  urgent: 'ri-error-warning-line',
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const assignedName = task.assigned_to ? (employeeNames[task.assigned_to] || 'غير معين') : 'غير معين';

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-background-50 border border-background-200/70 rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all duration-200 group"
    >
      {/* Priority + Branch row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
            taskPriorityVariant[task.priority] === 'danger'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              : taskPriorityVariant[task.priority] === 'warning'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                : taskPriorityVariant[task.priority] === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-background-200 text-foreground-700'
          }`}
        >
          <i className={`${priorityIcons[task.priority]} text-xs`} />
          {taskPriorityLabels[task.priority]}
        </span>
        {task.branch_id && (
          <span className="text-xs text-foreground-400">{branchNames[task.branch_id]}</span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground-900 mb-1.5 line-clamp-2 group-hover:text-primary-700 transition-colors font-heading">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-foreground-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-foreground-400">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 flex items-center justify-center">
            <i className="ri-user-line" />
          </span>
          <span className="truncate max-w-[100px]">{assignedName}</span>
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-calendar-line" />
            </span>
            <span>{new Date(task.due_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Comment count */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-background-200/70">
        <span className="text-xs text-foreground-400 flex items-center gap-1">
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-chat-3-line text-xs" />
          </span>
          تعليقات
        </span>
      </div>
    </div>
  );
}