import { useMutation, useQuery } from "@tanstack/react-query";
import { reportsService } from "@/features/reports/services/reports.service";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { toast } from "@/shared/stores/toast.store";

export function useWorkspaceReportQuery(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["workspace-report", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return reportsService.getOverview(workspaceId);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useWorkspaceActivityLogsQuery(
  workspaceId: string | undefined,
  params: { entityType?: string; limit?: number } = {},
) {
  return useQuery({
    queryKey: ["workspace-activity-logs", workspaceId, params],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return reportsService.getActivityLogs(workspaceId, params);
    },
    enabled: Boolean(workspaceId),
  });
}

export function useExportReportCsv(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }
      return reportsService.downloadCsv(workspaceId);
    },
    onSuccess: () => {
      toast.success("Đã xuất báo cáo CSV!");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Không thể xuất báo cáo CSV."));
    },
  });
}
