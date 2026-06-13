import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { RouteGuardLoading } from "@/shared/components/RouteGuardLoading";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return <RouteGuardLoading />;
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to={ROUTE_PATHS.LOGIN}
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}
