import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { taskService } from "@/features/tasks/services/task.service";
import type {
  ArchiveTaskVariables,
  CreateTaskVariables,
  TaskQueryParams,
  UpdateTaskVariables,
} from "@/features/tasks/types/task.types";

const TASKS_QUERY_KEY = ["tasks"] as const;

export const taskQueryKeys = {
  all: TASKS_QUERY_KEY,
  workspaceLists: (workspaceId: string | null) =>
    [...TASKS_QUERY_KEY, "workspace", workspaceId] as const,
  workspaceList: (workspaceId: string | null, params: TaskQueryParams) =>
    [...TASKS_QUERY_KEY, "workspace", workspaceId, params] as const,
  workspaceSummary: (workspaceId: string | null) =>
    [...TASKS_QUERY_KEY, "summary", workspaceId] as const,
};

export function useWorkspaceTasksQuery(
  workspaceId: string | null,
  params: TaskQueryParams,
) {
  return useQuery({
    queryKey: taskQueryKeys.workspaceList(workspaceId, params),
    queryFn: () =>
      taskService.getWorkspaceTasks(workspaceId as string, params),
    enabled: Boolean(workspaceId),
  });
}

export function useWorkspaceTaskSummaryQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: taskQueryKeys.workspaceSummary(workspaceId),
    queryFn: () => taskService.getWorkspaceSummary(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, payload }: CreateTaskVariables) =>
      taskService.create(workspaceId, projectId, payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      payload,
    }: UpdateTaskVariables) =>
      taskService.update(workspaceId, projectId, taskId, payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useArchiveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, taskId }: ArchiveTaskVariables) =>
      taskService.archive(workspaceId, projectId, taskId),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
