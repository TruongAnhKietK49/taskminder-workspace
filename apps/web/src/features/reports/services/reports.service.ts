import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type {
  ActivityLogItem,
  WorkspaceReportOverview,
} from "@/features/reports/types/reports.types";

export const reportsService = {
  async getOverview(workspaceId: string) {
    const response = await apiClient.get<
      ApiResponse<{ report: WorkspaceReportOverview }>
    >(`/workspaces/${workspaceId}/reports/overview`);

    return response.data.data.report;
  },

  async getActivityLogs(
    workspaceId: string,
    params: { entityType?: string; limit?: number } = {},
  ) {
    const response = await apiClient.get<
      ApiResponse<{ logs: ActivityLogItem[] }>
    >(`/workspaces/${workspaceId}/activity-logs`, { params });

    return response.data.data.logs;
  },

  async downloadCsv(workspaceId: string) {
    const response = await apiClient.get<Blob>(
      `/workspaces/${workspaceId}/reports/export.csv`,
      { responseType: "blob" },
    );

    const disposition = response.headers["content-disposition"] as
      | string
      | undefined;
    const match = disposition?.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `taskminder-report-${workspaceId}.csv`;

    const blobUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  },
};
