import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { taskService } from "@/features/tasks/services/task.service";
import type {
  ArchiveTaskVariables,
  CreateTaskVariables,
  TaskQueryParams,
  UpdateTaskVariables,
  WorkspaceTask,
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
  comments: (taskId: string | null) =>
    [...TASKS_QUERY_KEY, "comments", taskId] as const,
  attachments: (taskId: string | null) =>
    [...TASKS_QUERY_KEY, "attachments", taskId] as const,
  activities: (taskId: string | null) =>
    [...TASKS_QUERY_KEY, "activities", taskId] as const,
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

    onMutate: async (variables) => {
      const listPrefix = taskQueryKeys.workspaceLists(variables.workspaceId);
      await queryClient.cancelQueries({ queryKey: listPrefix });

      const previousLists = queryClient.getQueriesData<WorkspaceTask[]>({
        queryKey: listPrefix,
      });

      queryClient.setQueriesData<WorkspaceTask[]>(
        { queryKey: listPrefix },
        (currentTasks) => {
          if (!currentTasks) {
            return currentTasks;
          }

          return currentTasks.map((task) => {
            if (task.id !== variables.taskId) {
              return task;
            }

            return {
              ...task,
              ...(variables.payload.title !== undefined
                ? { title: variables.payload.title }
                : {}),
              ...(variables.payload.description !== undefined
                ? { description: variables.payload.description }
                : {}),
              ...(variables.payload.status !== undefined
                ? { status: variables.payload.status }
                : {}),
              ...(variables.payload.priority !== undefined
                ? { priority: variables.payload.priority }
                : {}),
              ...(variables.payload.dueDate !== undefined
                ? { dueDate: variables.payload.dueDate }
                : {}),
            };
          });
        },
      );

      return { previousLists };
    },

    onError: (_error, _variables, context) => {
      if (!context?.previousLists) {
        return;
      }

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }
    },

    onSettled: () => {
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

export function useTaskCommentsQuery(
  workspaceId: string | null,
  projectId: string | null,
  taskId: string | null,
) {
  return useQuery({
    queryKey: taskQueryKeys.comments(taskId),
    queryFn: () =>
      taskService.getComments(
        workspaceId as string,
        projectId as string,
        taskId as string,
      ),
    enabled: Boolean(workspaceId && projectId && taskId),
  });
}

export function useCreateTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      content,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      content: string;
    }) => taskService.createComment(workspaceId, projectId, taskId, content),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.comments(variables.taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.activities(variables.taskId),
      });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useUpdateTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      commentId,
      content,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      commentId: string;
      content: string;
    }) =>
      taskService.updateComment(
        workspaceId,
        projectId,
        taskId,
        commentId,
        content,
      ),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.comments(variables.taskId),
      });
    },
  });
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      commentId,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      commentId: string;
    }) =>
      taskService.deleteComment(workspaceId, projectId, taskId, commentId),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.comments(variables.taskId),
      });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useTaskAttachmentsQuery(
  workspaceId: string | null,
  projectId: string | null,
  taskId: string | null,
) {
  return useQuery({
    queryKey: taskQueryKeys.attachments(taskId),
    queryFn: () =>
      taskService.getAttachments(
        workspaceId as string,
        projectId as string,
        taskId as string,
      ),
    enabled: Boolean(workspaceId && projectId && taskId),
  });
}

export function useUploadTaskAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      file,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      file: File;
    }) => taskService.uploadAttachment(workspaceId, projectId, taskId, file),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.attachments(variables.taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.activities(variables.taskId),
      });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useDeleteTaskAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      projectId,
      taskId,
      attachmentId,
    }: {
      workspaceId: string;
      projectId: string;
      taskId: string;
      attachmentId: string;
    }) =>
      taskService.deleteAttachment(
        workspaceId,
        projectId,
        taskId,
        attachmentId,
      ),

    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.attachments(variables.taskId),
      });
      void queryClient.invalidateQueries({
        queryKey: taskQueryKeys.activities(variables.taskId),
      });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}

export function useTaskActivitiesQuery(
  workspaceId: string | null,
  projectId: string | null,
  taskId: string | null,
) {
  return useQuery({
    queryKey: taskQueryKeys.activities(taskId),
    queryFn: () =>
      taskService.getActivities(
        workspaceId as string,
        projectId as string,
        taskId as string,
      ),
    enabled: Boolean(workspaceId && projectId && taskId),
  });
}
