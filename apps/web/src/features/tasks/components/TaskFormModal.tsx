import { type FormEvent, useMemo, useState } from "react";

import { useProjectMembersQuery } from "@/features/projects/hooks/useProjects";
import type { Project } from "@/features/projects/types/project.types";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TITLE_MAX_LENGTH,
} from "@/features/tasks/constants/task.constants";
import type {
  ActiveTaskStatus,
  CreateTaskPayload,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";

type TaskFormModalProps = {
  open: boolean;
  workspaceId: string;
  projects: Project[];
  defaultProjectId?: string;
  defaultStatus?: ActiveTaskStatus;
  task?: WorkspaceTask | null;
  currentUserId: string | null;
  canAssignOthers: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (
    projectId: string,
    payload: CreateTaskPayload | UpdateTaskPayload,
  ) => void;
};

type TaskFormModalContentProps = Omit<TaskFormModalProps, "open">;

export function TaskFormModal({
  open,
  workspaceId,
  projects,
  defaultProjectId,
  defaultStatus = "TODO",
  task,
  currentUserId,
  canAssignOthers,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <TaskFormModalContent
      key={task?.id ?? `create-${defaultProjectId ?? ""}-${defaultStatus}`}
      workspaceId={workspaceId}
      projects={projects}
      defaultProjectId={defaultProjectId}
      defaultStatus={defaultStatus}
      task={task}
      currentUserId={currentUserId}
      canAssignOthers={canAssignOthers}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function TaskFormModalContent({
  workspaceId,
  projects,
  defaultProjectId,
  defaultStatus = "TODO",
  task,
  currentUserId,
  canAssignOthers,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: TaskFormModalContentProps) {
  const isEditMode = Boolean(task);

  const availableProjects = useMemo(() => {
    const active = projects.filter((p) => p.status !== "ARCHIVED");
    return active.length > 0 ? active : projects;
  }, [projects]);

  const initialProjectId =
    task?.projectId ??
    (defaultProjectId &&
    availableProjects.some((project) => project.id === defaultProjectId)
      ? defaultProjectId
      : availableProjects[0]?.id ?? "");

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaultStatus,
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM",
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? "");

  const membersQuery = useProjectMembersQuery(
    workspaceId,
    selectedProjectId || null,
  );

  const members = useMemo(
    () => membersQuery.data ?? [],
    [membersQuery.data],
  );

  const isAssignedToSomeoneElse = Boolean(
    isEditMode && task?.assigneeId && task.assigneeId !== currentUserId,
  );
  const assigneeLockedForMember = !canAssignOthers && isAssignedToSomeoneElse;

  const selectableMembers = useMemo(() => {
    if (canAssignOthers) {
      return members;
    }

    return members.filter((member) => member.user.id === currentUserId);
  }, [canAssignOthers, currentUserId, members]);

  function handleProjectChange(nextProjectId: string) {
    setSelectedProjectId(nextProjectId);
    setAssigneeId("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (normalizedTitle.length < 2 || !selectedProjectId) {
      return;
    }

    const isoDueDate = dueDate ? `${dueDate}T12:00:00.000Z` : undefined;

    if (isEditMode) {
      const payload: UpdateTaskPayload = {
        title: normalizedTitle,
        description: normalizedDescription || null,
        status,
        priority,
        dueDate: dueDate ? `${dueDate}T12:00:00.000Z` : null,
      };

      if (!assigneeLockedForMember) {
        payload.assigneeId = assigneeId || null;
      }

      onSubmit(selectedProjectId, payload);
      return;
    }

    const payload: CreateTaskPayload = {
      title: normalizedTitle,
      status,
      priority,
    };

    if (normalizedDescription) {
      payload.description = normalizedDescription;
    }

    if (isoDueDate) {
      payload.dueDate = isoDueDate;
    }

    if (assigneeId) {
      payload.assigneeId = assigneeId;
    }

    onSubmit(selectedProjectId, payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            {isEditMode ? "Edit task" : "Create task"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Cập nhật thông tin, tiến độ, độ ưu tiên và người phụ trách."
              : "Tạo công việc mới trong project và theo dõi trên board."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="task-project"
              className="text-sm font-medium text-slate-700"
            >
              Project
            </label>

            {isEditMode ? (
              <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
                {task?.project.name}
              </div>
            ) : (
              <select
                id="task-project"
                value={selectedProjectId}
                disabled={isSubmitting}
                onChange={(event) => handleProjectChange(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label
              htmlFor="task-title"
              className="text-sm font-medium text-slate-700"
            >
              Task title
            </label>

            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TASK_TITLE_MAX_LENGTH}
              placeholder="Ví dụ: Implement Kanban drag-and-drop"
              disabled={isSubmitting}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            />

            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Tối thiểu 2 ký tự</span>
              <span>
                {title.length}/{TASK_TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={TASK_DESCRIPTION_MAX_LENGTH}
              rows={3}
              placeholder="Mô tả chi tiết yêu cầu hoặc acceptance criteria..."
              disabled={isSubmitting}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            />

            <div className="mt-1 flex justify-end text-xs text-slate-500">
              <span>
                {description.length}/{TASK_DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-status"
                className="text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="task-status"
                value={status}
                disabled={isSubmitting}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {TASK_STATUS_OPTIONS.filter(
                  (opt) => opt.value !== "ARCHIVED" || task?.status === "ARCHIVED",
                ).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="text-sm font-medium text-slate-700"
              >
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                disabled={isSubmitting}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-due-date"
                className="text-sm font-medium text-slate-700"
              >
                Due date
              </label>

              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                disabled={isSubmitting}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="task-assignee"
                className="text-sm font-medium text-slate-700"
              >
                Assignee
              </label>

              <select
                id="task-assignee"
                value={assigneeId}
                disabled={
                  isSubmitting ||
                  membersQuery.isLoading ||
                  assigneeLockedForMember
                }
                onChange={(event) => setAssigneeId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {assigneeLockedForMember && task?.assignee ? (
                  <option value={task.assignee.id}>
                    {task.assignee.fullName}
                  </option>
                ) : (
                  <>
                    <option value="">Unassigned</option>
                    {selectableMembers.map((member) => (
                      <option key={member.user.id} value={member.user.id}>
                        {member.user.fullName} ({member.user.email})
                      </option>
                    ))}
                  </>
                )}
              </select>

              {assigneeLockedForMember ? (
                <p className="mt-1 text-xs text-slate-500">
                  Chỉ Owner/Admin mới có thể giao việc cho thành viên khác.
                </p>
              ) : !canAssignOthers ? (
                <p className="mt-1 text-xs text-slate-500">
                  Member có thể tự nhận việc hoặc bỏ nhận việc của mình.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                title.trim().length < 2 ||
                !selectedProjectId
              }
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
