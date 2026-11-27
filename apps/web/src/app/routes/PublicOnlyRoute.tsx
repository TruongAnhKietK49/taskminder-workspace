import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { RouteGuardLoading } from "@/shared/components/RouteGuardLoading";

type LocationState = {
  from?: string;
};

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return <RouteGuardLoading />;
  }

  if (status === "authenticated") {
    const from = (location.state as LocationState | null)?.from;
    const target =
      typeof from === "string" && from.startsWith("/")
        ? from
        : ROUTE_PATHS.DASHBOARD;

    return <Navigate to={target} replace />;
  }

  return children;
}
