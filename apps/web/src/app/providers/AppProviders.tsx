import { type PropsWithChildren, useEffect } from "react";
import { ToastContainer } from "@/shared/components/ToastContainer";
import {
  applyThemeToDocument,
  useThemeStore,
} from "@/shared/stores/theme.store";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return (
    <AuthProvider>
      <QueryProvider>
        {children}
        <ToastContainer />
      </QueryProvider>
    </AuthProvider>
  );
}
