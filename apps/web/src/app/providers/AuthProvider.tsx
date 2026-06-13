import { type PropsWithChildren, useEffect, useRef } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export function AuthProvider({ children }: PropsWithChildren) {
  const initialize = useAuthStore((state) => state.initialize);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    void initialize();
  }, [initialize]);

  return children;
}
