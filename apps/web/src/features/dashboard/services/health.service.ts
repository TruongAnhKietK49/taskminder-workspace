import { apiClient } from "@/shared/lib/api-client";

export type HealthCheckResponse = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

export async function getHealthCheck() {
  const response = await apiClient.get<HealthCheckResponse>("/health");

  return response.data;
}
