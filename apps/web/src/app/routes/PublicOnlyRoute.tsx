import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { RouteGuardLoading } from "@/shared/components/RouteGuardLoading";

export function PublicOnlyRoute({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return <RouteGuardLoading />;
  }

  if (status === "authenticated") {
    return <Navigate to={ROUTE_PATHS.DASHBOARD} replace />;
  }

  return children;
}
