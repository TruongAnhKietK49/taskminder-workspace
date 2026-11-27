import { Outlet } from "react-router-dom";

import { useThemeStore } from "@/shared/stores/theme.store";

export function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="relative min-h-screen bg-slate-950 text-white">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Light/Dark theme"
        className="absolute right-4 top-4 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <Outlet />
      </div>
    </main>
  );
}
