import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",

      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const nextTheme: ThemeMode = get().theme === "dark" ? "light" : "dark";
        applyThemeToDocument(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: "taskminder-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    },
  ),
);
