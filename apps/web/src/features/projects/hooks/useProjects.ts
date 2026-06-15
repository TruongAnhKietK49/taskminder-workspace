import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectService } from "@/features/projects/services/project.service";
import type {
  ArchiveProjectVariables,
  CreateProjectVariables,
  Project,
  UpdateProjectVariables,
} from "@/features/projects/types/project.types";

const PROJECTS_QUERY_KEY = ["projects"] as const;

export const projectQueryKeys = {
  all: PROJECTS_QUERY_KEY,
  lists: () => [...PROJECTS_QUERY_KEY, "list"] as const,
  list: (workspaceId: string | null) =>
    [...PROJECTS_QUERY_KEY, "list", workspaceId] as const,
  details: () => [...PROJECTS_QUERY_KEY, "detail"] as const,
  detail: (workspaceId: string | null, projectId: string | null) =>
    [...PROJECTS_QUERY_KEY, "detail", workspaceId, projectId] as const,
};

function sortProjects(projects: Project[]) {
  return [...projects].sort(
    (firstProject, secondProject) =>
      Date.parse(secondProject.updatedAt) - Date.parse(firstProject.updatedAt),
  );
}

export function useProjectsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: projectQueryKeys.list(workspaceId),
    queryFn: () => projectService.getAll(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

export function useProjectQuery(
  workspaceId: string | null,
  projectId: string | null,
) {
  return useQuery({
    queryKey: projectQueryKeys.detail(workspaceId, projectId),
    queryFn: () =>
      projectService.getById(workspaceId as string, projectId as string),
    enabled: Boolean(workspaceId && projectId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, payload }: CreateProjectVariables) =>
      projectService.create(workspaceId, payload),

    onSuccess: (project, variables) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(variables.workspaceId),
        (currentProjects = []) =>
          sortProjects([
            project,
            ...currentProjects.filter(
              (currentProject) => currentProject.id !== project.id,
            ),
          ]),
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(variables.workspaceId, project.id),
        project,
      );
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId, payload }: UpdateProjectVariables) =>
      projectService.update(workspaceId, projectId, payload),

    onSuccess: (updatedProject, variables) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(variables.workspaceId),
        (currentProjects) => {
          if (!currentProjects) {
            return currentProjects;
          }

          return sortProjects(
            currentProjects.map((project) =>
              project.id === updatedProject.id ? updatedProject : project,
            ),
          );
        },
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(variables.workspaceId, updatedProject.id),
        updatedProject,
      );
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, projectId }: ArchiveProjectVariables) =>
      projectService.archive(workspaceId, projectId),

    onSuccess: (archivedProject, variables) => {
      queryClient.setQueryData<Project[]>(
        projectQueryKeys.list(variables.workspaceId),
        (currentProjects) => {
          if (!currentProjects) {
            return currentProjects;
          }

          return sortProjects(
            currentProjects.map((project) =>
              project.id === archivedProject.id ? archivedProject : project,
            ),
          );
        },
      );

      queryClient.setQueryData(
        projectQueryKeys.detail(variables.workspaceId, archivedProject.id),
        archivedProject,
      );
    },
  });
}
