import { useQuery } from "@tanstack/react-query";
import { getHealthCheck } from "../services/health.service";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health-check"],
    queryFn: getHealthCheck,
  });
}
