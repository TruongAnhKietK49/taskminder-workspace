import { apiClient } from "@/shared/lib/api-client";
import type { ApiResponse } from "@/shared/types/api.types";
import type { GlobalSearchResponse } from "@/features/search/types/search.types";

export const searchService = {
  async searchWorkspace(workspaceId: string, query: string) {
    const response = await apiClient.get<ApiResponse<GlobalSearchResponse>>(
      `/workspaces/${workspaceId}/search`,
      { params: { q: query } },
    );

    return response.data.data;
  },
};
