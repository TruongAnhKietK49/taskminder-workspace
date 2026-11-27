import { useState } from "react";

import { TaskCard } from "@/features/tasks/components/TaskCard";
import {
  BOARD_TASK_STATUSES,
  TASK_STATUS_OPTIONS,
} from "@/features/tasks/constants/task.constants";
import type {
  ActiveTaskStatus,
  TaskStatus,
  WorkspaceTask,
} from "@/features/tasks/types/task.types";

type TaskBoardViewProps = {
  tasks: WorkspaceTask[];
  showProjectBadge: boolean;
  updatingTaskId: string | null;
  canEditTask: (task: WorkspaceTask) => boolean;
  canCreateTask: boolean;
  onOpenDetail: (task: WorkspaceTask) => void;
  onStatusChange: (task: WorkspaceTask, status: TaskStatus) => void;
  onQuickCreate: (status: ActiveTaskStatus) => void;
  onEdit: (task: WorkspaceTask) => void;
  onArchive: (task: WorkspaceTask) => void;
};

export function TaskBoardView({
  tasks,
  showProjectBadge,
  updatingTaskId,
  canEditTask,
  canCreateTask,
  onOpenDetail,
  onStatusChange,
  onQuickCreate,
  onEdit,
  onArchive,
}: TaskBoardViewProps) {
  const [dragOverColumn, setDragOverColumn] =
    useState<ActiveTaskStatus | null>(null);

  const archivedTasks = tasks.filter((task) => task.status === "ARCHIVED");

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetStatus: ActiveTaskStatus,
  ) {
    event.preventDefault();
    setDragOverColumn(null);

    const taskId = event.dataTransfer.getData("text/plain");
    if (!taskId) {
      return;
    }

    const draggedTask = tasks.find((task) => task.id === taskId);
    if (!draggedTask || draggedTask.status === targetStatus) {
      return;
    }

    if (!canEditTask(draggedTask)) {
      return;
    }

    onStatusChange(draggedTask, targetStatus);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {BOARD_TASK_STATUSES.map((status) => {
          const columnMeta = TASK_STATUS_OPTIONS.find(
            (opt) => opt.value === status,
          );
          const columnTasks = tasks.filter((task) => task.status === status);
          const isDropActive = dragOverColumn === status;

          return (
            <div
              key={status}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragOverColumn !== status) {
                  setDragOverColumn(status);
                }
              }}
              onDragLeave={() => {
                if (dragOverColumn === status) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(event) => handleDrop(event, status)}
              className={[
                "flex min-h-[340px] flex-col rounded-2xl border border-t-4 bg-slate-50/80 p-3 transition",
                columnMeta?.columnBorderClass ?? "border-t-slate-400",
                isDropActive
                  ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-200"
                  : "border-slate-200",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "h-2.5 w-2.5 rounded-full",
                      columnMeta?.dotClass ?? "bg-slate-400",
                    ].join(" ")}
                  />
                  <h3 className="text-sm font-semibold text-slate-900">
                    {columnMeta?.label ?? status}
                  </h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {columnTasks.length}
                  </span>
                </div>

                {canCreateTask ? (
                  <button
                    type="button"
                    title={`Add task to ${columnMeta?.label ?? status}`}
                    onClick={() => onQuickCreate(status)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  >
                    +
                  </button>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showProjectBadge={showProjectBadge}
                      canEdit={canEditTask(task)}
                      isUpdating={updatingTaskId === task.id}
                      onOpenDetail={onOpenDetail}
                      onStatusChange={onStatusChange}
                      onEdit={onEdit}
                      onArchive={onArchive}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-400">
                    Drop task here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {archivedTasks.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
            <h3 className="text-sm font-semibold text-slate-800">
              Archived tasks ({archivedTasks.length})
            </h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {archivedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showProjectBadge={showProjectBadge}
                canEdit={canEditTask(task)}
                isUpdating={updatingTaskId === task.id}
                onOpenDetail={onOpenDetail}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onArchive={onArchive}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
