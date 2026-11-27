import { useMemo, useRef, useState } from "react";

import { useProjectMembersQuery } from "@/features/projects/hooks/useProjects";
import {
  TASK_PRIORITY_BADGE_CLASSES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_BADGE_CLASSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import {
  useCreateTaskComment,
  useCreateTaskReminder,
  useDeleteTaskAttachment,
  useDeleteTaskComment,
  useDeleteTaskReminder,
  useTaskActivitiesQuery,
  useTaskAttachmentsQuery,
  useTaskCommentsQuery,
  useTaskRemindersQuery,
  useUpdateTaskComment,
  useUploadTaskAttachment,
} from "@/features/tasks/hooks/useTasks";
import { taskService } from "@/features/tasks/services/task.service";
import type {
  TaskActivity,
  TaskComment,
  TaskStatus,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";
import {
  formatShortDate,
  getDueDateStatus,
  getInitials,
} from "@/features/tasks/utils/task-helpers";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type TaskDetailDrawerProps = {
  workspaceId: string;
  task: WorkspaceTask | null;
  currentUserId: string | null;
  isWorkspaceManager: boolean;
  canEdit: boolean;
  isUpdatingStatus: boolean;
  onClose: () => void;
  onEdit: (task: WorkspaceTask) => void;
  onArchive: (task: WorkspaceTask) => void;
  onStatusChange: (task: WorkspaceTask, status: TaskStatus) => void;
};

type TaskDetailTab = "comments" | "attachments" | "reminders" | "activity";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function describeActivity(activity: TaskActivity): string {
  const newVal = activity.newValue ?? {};
  const oldVal = activity.oldValue ?? {};

  switch (activity.action) {
    case "TASK_CREATED":
      return "created this task";
    case "STATUS_CHANGED": {
      const fromStatus =
        typeof oldVal.status === "string"
          ? (TASK_STATUS_LABELS[oldVal.status as TaskStatus] ?? oldVal.status)
          : "Unknown";
      const toStatus =
        typeof newVal.status === "string"
          ? (TASK_STATUS_LABELS[newVal.status as TaskStatus] ?? newVal.status)
          : "Unknown";
      return `moved status from ${fromStatus} to ${toStatus}`;
    }
    case "ASSIGNEE_CHANGED": {
      const nextName =
        typeof newVal.assigneeName === "string"
          ? newVal.assigneeName
          : "Unassigned";
      return `changed assignee to ${nextName}`;
    }
    case "TASK_UPDATED":
      return `updated ${Object.keys(newVal).join(", ") || "task details"}`;
    case "TASK_ARCHIVED":
      return "archived this task";
    case "COMMENT_ADDED":
      return "added a comment";
    case "ATTACHMENT_UPLOADED": {
      const fileName =
        typeof newVal.originalName === "string"
          ? newVal.originalName
          : "a file";
      return `uploaded ${fileName}`;
    }
    case "ATTACHMENT_DELETED": {
      const fileName =
        typeof oldVal.originalName === "string"
          ? oldVal.originalName
          : "a file";
      return `deleted attachment ${fileName}`;
    }
    default:
      return activity.action.toLowerCase().replace(/_/g, " ");
  }
}

export function TaskDetailDrawer(props: TaskDetailDrawerProps) {
  if (!props.task) {
    return null;
  }

  return (
    <TaskDetailDrawerContent
      key={props.task.id}
      {...props}
      task={props.task}
    />
  );
}

function TaskDetailDrawerContent({
  workspaceId,
  task,
  currentUserId,
  isWorkspaceManager,
  canEdit,
  isUpdatingStatus,
  onClose,
  onEdit,
  onArchive,
  onStatusChange,
}: Omit<TaskDetailDrawerProps, "task"> & { task: WorkspaceTask }) {
  const [activeTab, setActiveTab] = useState<TaskDetailTab>("comments");
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [customReminderAt, setCustomReminderAt] = useState("");
  const [tabError, setTabError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const commentsQuery = useTaskCommentsQuery(
    workspaceId,
    task.projectId,
    task.id,
  );
  const attachmentsQuery = useTaskAttachmentsQuery(
    workspaceId,
    task.projectId,
    task.id,
  );
  const activitiesQuery = useTaskActivitiesQuery(
    workspaceId,
    task.projectId,
    task.id,
  );
  const remindersQuery = useTaskRemindersQuery(
    workspaceId,
    task.projectId,
    task.id,
  );
  const membersQuery = useProjectMembersQuery(workspaceId, task.projectId);

  const createCommentMutation = useCreateTaskComment();
  const updateCommentMutation = useUpdateTaskComment();
  const deleteCommentMutation = useDeleteTaskComment();
  const uploadAttachmentMutation = useUploadTaskAttachment();
  const deleteAttachmentMutation = useDeleteTaskAttachment();
  const createReminderMutation = useCreateTaskReminder();
  const deleteReminderMutation = useDeleteTaskReminder();

  const comments = useMemo(
    () => commentsQuery.data ?? [],
    [commentsQuery.data],
  );
  const attachments = useMemo(
    () => attachmentsQuery.data ?? [],
    [attachmentsQuery.data],
  );
  const activities = useMemo(
    () => activitiesQuery.data ?? [],
    [activitiesQuery.data],
  );
  const reminders = useMemo(
    () => remindersQuery.data ?? [],
    [remindersQuery.data],
  );
  const members = useMemo(
    () => membersQuery.data ?? [],
    [membersQuery.data],
  );

  const dueStatus = getDueDateStatus(task.dueDate, task.status);
  const isArchived = task.status === "ARCHIVED";

  function handleInsertMention(fullName: string) {
    const token = `@${fullName} `;
    setCommentInput((prev) =>
      prev && !prev.endsWith(" ") ? `${prev} ${token}` : `${prev}${token}`,
    );
  }

  function handleCreateComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = commentInput.trim();
    if (!trimmed) {
      return;
    }

    setTabError(null);
    createCommentMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        content: trimmed,
      },
      {
        onSuccess: () => {
          setCommentInput("");
        },
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleStartEditComment(comment: TaskComment) {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
    setTabError(null);
  }

  function handleSaveEditComment(commentId: string) {
    const trimmed = editingCommentText.trim();
    if (!trimmed) {
      return;
    }

    setTabError(null);
    updateCommentMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        commentId,
        content: trimmed,
      },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditingCommentText("");
        },
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleDeleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    setTabError(null);
    deleteCommentMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        commentId,
      },
      {
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setTabError(null);
    uploadAttachmentMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        file,
      },
      {
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  async function handleDownload(attachmentId: string, originalName: string) {
    setTabError(null);
    try {
      await taskService.downloadAttachment(
        workspaceId,
        task.projectId,
        task.id,
        attachmentId,
        originalName,
      );
    } catch (error) {
      setTabError(getApiErrorMessage(error));
    }
  }

  function handleDeleteAttachment(attachmentId: string, originalName: string) {
    if (!window.confirm(`Delete attachment "${originalName}"?`)) {
      return;
    }

    setTabError(null);
    deleteAttachmentMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        attachmentId,
      },
      {
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleCreatePresetReminder(offsetMinutes: number) {
    if (!task.dueDate) {
      return;
    }

    const dueMs = Date.parse(task.dueDate);
    if (Number.isNaN(dueMs)) {
      return;
    }

    const targetIso = new Date(dueMs - offsetMinutes * 60 * 1000).toISOString();
    setTabError(null);
    createReminderMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        remindAt: targetIso,
      },
      {
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleCreateCustomReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customReminderAt) {
      return;
    }

    setTabError(null);
    createReminderMutation.mutate(
      {
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        remindAt: new Date(customReminderAt).toISOString(),
      },
      {
        onSuccess: () => {
          setCustomReminderAt("");
        },
        onError: (error) => {
          setTabError(getApiErrorMessage(error));
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {task.project.name}
              </span>
              <span
                className={[
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                  TASK_PRIORITY_BADGE_CLASSES[task.priority],
                ].join(" ")}
              >
                {TASK_PRIORITY_LABELS[task.priority]}
              </span>
            </div>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              {task.title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                {!isArchived ? (
                  <button
                    type="button"
                    onClick={() => onArchive(task)}
                    className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Archive
                  </button>
                ) : null}
              </>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close task details"
              className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Status</p>
              <div className="mt-1">
                {canEdit ? (
                  <select
                    aria-label="Detail status"
                    value={task.status}
                    disabled={isUpdatingStatus}
                    onChange={(event) =>
                      onStatusChange(task, event.target.value as TaskStatus)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    {TASK_STATUS_OPTIONS.filter(
                      (opt) => opt.value !== "ARCHIVED" || isArchived,
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                      TASK_STATUS_BADGE_CLASSES[task.status],
                    ].join(" ")}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Assignee</p>
              <p className="mt-1 font-semibold text-slate-900">
                {task.assignee ? task.assignee.fullName : "Unassigned"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Due date</p>
              <p
                className={[
                  "mt-1 font-semibold",
                  dueStatus === "overdue"
                    ? "text-red-700"
                    : dueStatus === "soon"
                      ? "text-amber-700"
                      : "text-slate-900",
                ].join(" ")}
              >
                {task.dueDate
                  ? `${dueStatus === "overdue" ? "Overdue · " : ""}${formatShortDate(task.dueDate)}`
                  : "No due date"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Created by</p>
              <p className="mt-1 font-semibold text-slate-900">
                {task.createdBy.fullName}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </p>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {task.description || "No description provided."}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("comments");
                  setTabError(null);
                }}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === "comments"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                Comments ({comments.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("attachments");
                  setTabError(null);
                }}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === "attachments"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                Attachments ({attachments.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("reminders");
                  setTabError(null);
                }}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === "reminders"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                Reminders ({reminders.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("activity");
                  setTabError(null);
                }}
                className={[
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  activeTab === "activity"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
              >
                Activity ({activities.length})
              </button>
            </div>

            {tabError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                {tabError}
              </div>
            ) : null}

            {activeTab === "comments" ? (
              <div className="mt-4 space-y-4">
                {commentsQuery.isLoading ? (
                  <p className="text-xs text-slate-500">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    No comments yet. Start the discussion below.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const isAuthor = comment.authorId === currentUserId;
                      const canDelete = isAuthor || isWorkspaceManager;
                      const isEditingThis = editingCommentId === comment.id;

                      return (
                        <div
                          key={comment.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                                {getInitials(comment.author.fullName)}
                              </span>
                              <span className="text-xs font-semibold text-slate-900">
                                {comment.author.fullName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDateTime(comment.createdAt)}
                                {comment.editedAt ? " (edited)" : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAuthor && !isEditingThis ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartEditComment(comment)
                                  }
                                  className="text-xs font-medium text-slate-600 hover:text-slate-950"
                                >
                                  Edit
                                </button>
                              ) : null}
                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="text-xs font-medium text-red-600 hover:text-red-700"
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </div>

                          {isEditingThis ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(event) =>
                                  setEditingCommentText(event.target.value)
                                }
                                rows={2}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingCommentId(null)}
                                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    updateCommentMutation.isPending ||
                                    !editingCommentText.trim()
                                  }
                                  onClick={() =>
                                    handleSaveEditComment(comment.id)
                                  }
                                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-700">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handleCreateComment} className="space-y-2 pt-2">
                  {members.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        Mention:
                      </span>
                      {members.slice(0, 6).map((member) => (
                        <button
                          key={member.user.id}
                          type="button"
                          onClick={() =>
                            handleInsertMention(member.user.fullName)
                          }
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          @{member.user.fullName}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <textarea
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    rows={3}
                    placeholder="Write a comment or @mention a teammate..."
                    disabled={createCommentMutation.isPending}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        createCommentMutation.isPending || !commentInput.trim()
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {createCommentMutation.isPending
                        ? "Posting..."
                        : "Post comment"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {activeTab === "attachments" ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Upload attachment
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Max 10 MB · PNG, JPG, PDF, DOCX, XLSX, TXT, CSV, JSON, ZIP
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelected}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadAttachmentMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {uploadAttachmentMutation.isPending
                      ? "Uploading..."
                      : "+ Choose file"}
                  </button>
                </div>

                {attachmentsQuery.isLoading ? (
                  <p className="text-xs text-slate-500">
                    Loading attachments...
                  </p>
                ) : attachments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    No files attached yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {attachments.map((file) => {
                      const canDelete =
                        file.uploadedById === currentUserId ||
                        isWorkspaceManager;

                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 p-3.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {file.originalName}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatFileSize(file.size)} · Uploaded by{" "}
                              {file.uploadedBy.fullName} ·{" "}
                              {formatDateTime(file.createdAt)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleDownload(file.id, file.originalName)
                              }
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Download
                            </button>

                            {canDelete ? (
                              <button
                                type="button"
                                disabled={deleteAttachmentMutation.isPending}
                                onClick={() =>
                                  handleDeleteAttachment(
                                    file.id,
                                    file.originalName,
                                  )
                                }
                                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "reminders" ? (
              <div className="mt-4 space-y-4">
                {task.dueDate ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <p className="text-xs font-semibold text-slate-800">
                      Quick presets (before due date)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={createReminderMutation.isPending}
                        onClick={() => handleCreatePresetReminder(15)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        15m before
                      </button>
                      <button
                        type="button"
                        disabled={createReminderMutation.isPending}
                        onClick={() => handleCreatePresetReminder(60)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        1h before
                      </button>
                      <button
                        type="button"
                        disabled={createReminderMutation.isPending}
                        onClick={() => handleCreatePresetReminder(24 * 60)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        1 day before
                      </button>
                    </div>
                  </div>
                ) : null}

                <form
                  onSubmit={handleCreateCustomReminder}
                  className="flex flex-wrap items-end gap-2"
                >
                  <div className="min-w-[200px] flex-1">
                    <label className="text-xs font-medium text-slate-600">
                      Custom reminder time
                    </label>
                    <input
                      type="datetime-local"
                      value={customReminderAt}
                      onChange={(event) =>
                        setCustomReminderAt(event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      createReminderMutation.isPending || !customReminderAt
                    }
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Set reminder
                  </button>
                </form>

                {remindersQuery.isLoading ? (
                  <p className="text-xs text-slate-500">Loading reminders...</p>
                ) : reminders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    No reminders set for this task.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between gap-3 p-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDateTime(reminder.remindAt)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Status: {reminder.status}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            deleteReminderMutation.mutate({
                              workspaceId,
                              projectId: task.projectId,
                              taskId: task.id,
                              reminderId: reminder.id,
                            })
                          }
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "activity" ? (
              <div className="mt-4">
                {activitiesQuery.isLoading ? (
                  <p className="text-xs text-slate-500">Loading activity...</p>
                ) : activities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    No activity recorded yet.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {activities.map((activity) => (
                      <li
                        key={activity.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                          {getInitials(activity.actor.fullName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-700">
                            <strong className="font-semibold text-slate-950">
                              {activity.actor.fullName}
                            </strong>{" "}
                            {describeActivity(activity)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
