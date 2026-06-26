import { useState } from 'react';
import Modal from '@/components/base/Modal';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { taskStatusLabels, taskPriorityLabels, taskPriorityVariant, taskStatusVariant, branchNames, mockTaskComments } from '@/mocks/tasks';
import { employeeNames } from '@/mocks/employees';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Task, TaskComment } from '@/types/supabase';

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

export default function TaskDetailModal({ open, onClose, task, onStatusChange }: TaskDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const addNotification = useNotificationStore((s) => s.addNotification);

  // Reset comments when task changes
  const handleOpen = () => {
    if (task) {
      setComments(mockTaskComments.filter((c) => c.task_id === task.id));
      setNewComment('');
      setShowStatusDropdown(false);
    }
  };

  if (!task) return null;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  const assignedName = task.assigned_to ? (employeeNames[task.assigned_to] || 'غير معين') : 'غير معين';

  const handleAddComment = () => {
    if (!newComment.trim() || !task) return;
    const comment: TaskComment = {
      id: `tc-new-${Date.now()}`,
      task_id: task.id,
      user_id: 'user-super-admin',
      content: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    setComments([comment, ...comments]);
    setNewComment('');

    addNotification({
      user_id: task.assigned_to || 'user-super-admin',
      title: `تعليق جديد: ${task.title}`,
      message: `تعليق جديد على المهمة "${task.title}": "${newComment.trim().slice(0, 80)}${newComment.trim().length > 80 ? '...' : ''}"`,
      type: 'task_comment',
      is_read: false,
      link: '/tasks',
    });
  };

  const allStatuses: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];

  // Call handleOpen when modal opens
  if (open && comments.length === 0 && task) {
    handleOpen();
  }

  return (
    <Modal open={open} onClose={onClose} title="تفاصيل المهمة" size="lg">
      <div className="space-y-5">
        {/* Header section */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={taskStatusVariant[task.status]}>{taskStatusLabels[task.status]}</Badge>
            <Badge
              variant={
                taskPriorityVariant[task.priority] === 'danger'
                  ? 'danger'
                  : taskPriorityVariant[task.priority] === 'warning'
                    ? 'warning'
                    : taskPriorityVariant[task.priority] === 'success'
                      ? 'success'
                      : 'neutral'
              }
            >
              {taskPriorityLabels[task.priority]}
            </Badge>
            {task.branch_id && <Badge variant="secondary">{branchNames[task.branch_id]}</Badge>}
          </div>
          <h3 className="text-lg font-bold text-foreground-900 font-heading">{task.title}</h3>
        </div>

        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 flex items-center justify-center text-foreground-400">
              <i className="ri-user-line" />
            </span>
            <div>
              <p className="text-xs text-foreground-400">المسؤول</p>
              <p className="text-sm font-medium text-foreground-900">{assignedName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 flex items-center justify-center text-foreground-400">
              <i className="ri-calendar-line" />
            </span>
            <div>
              <p className="text-xs text-foreground-400">تاريخ التسليم</p>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-foreground-900'}`}>
                {task.due_date
                  ? new Date(task.due_date).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'غير محدد'}
                {isOverdue && ' (متأخر)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 flex items-center justify-center text-foreground-400">
              <i className="ri-time-line" />
            </span>
            <div>
              <p className="text-xs text-foreground-400">تاريخ الإنشاء</p>
              <p className="text-sm font-medium text-foreground-900">
                {new Date(task.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          {task.completed_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 flex items-center justify-center text-foreground-400">
                <i className="ri-check-double-line" />
              </span>
              <div>
                <p className="text-xs text-foreground-400">تاريخ الإكمال</p>
                <p className="text-sm font-medium text-emerald-700">
                  {new Date(task.completed_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <p className="text-xs text-foreground-400 mb-1.5 font-medium">الوصف</p>
            <p className="text-sm text-foreground-700 bg-background-100 rounded-lg p-3 leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Status change */}
        {onStatusChange && task.status !== 'done' && (
          <div className="relative">
            <p className="text-xs text-foreground-400 mb-1.5 font-medium">تغيير الحالة</p>
            <div className="relative inline-block">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-background-100 border border-background-200 rounded-md text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
              >
                <span>{taskStatusLabels[task.status]}</span>
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-down-s-line text-sm" />
                </span>
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full mt-1 right-0 bg-background-50 border border-background-200/70 rounded-lg shadow-lg z-[110] min-w-[160px]">
                  {allStatuses
                    .filter((s) => s !== task.status)
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusChange(task.id, s);
                          setShowStatusDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer text-right"
                      >
                        <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
                        {taskStatusLabels[s]}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div>
          <p className="text-xs text-foreground-400 mb-3 font-medium">
            التعليقات ({comments.length})
          </p>

          {/* Add comment */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddComment();
              }}
              placeholder="أضف تعليقاً..."
              className="flex-1 px-3 py-2 text-sm bg-background-50 border border-background-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              إرسال
            </Button>
          </div>

          {/* Comments list */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.length === 0 && (
              <p className="text-sm text-foreground-400 text-center py-4">لا توجد تعليقات بعد</p>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-secondary-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-secondary-700">م</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground-900">
                      {comment.user_id === 'user-super-admin' ? 'مدير النظام' : assignedName}
                    </span>
                    <span className="text-xs text-foreground-400">
                      {new Date(comment.created_at).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}