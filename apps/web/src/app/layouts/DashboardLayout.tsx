import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { ProfileDropdown } from "@/features/auth/components/ProfileDropdown";
import { NotificationBellDropdown } from "@/features/notifications/components/NotificationBellDropdown";
import { GlobalSearchModal } from "@/features/search/components/GlobalSearchModal";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";
import { TaskMinderLogo } from "@/shared/components/TaskMinderLogo";
import { cn } from "@/shared/lib/cn";
import { useThemeStore } from "@/shared/stores/theme.store";

const navigationItems = [
  {
    label: "Dashboard",
    to: ROUTE_PATHS.DASHBOARD,
  },
  {
    label: "Workspaces",
    to: ROUTE_PATHS.WORKSPACES,
  },
  {
    label: "Projects",
    to: ROUTE_PATHS.PROJECTS,
  },
  {
    label: "Members",
    to: ROUTE_PATHS.MEMBERS,
  },
  {
    label: "Tasks",
    to: ROUTE_PATHS.TASKS,
  },
  {
    label: "Notifications",
    to: ROUTE_PATHS.NOTIFICATIONS,
  },
  {
    label: "Chat",
    to: ROUTE_PATHS.CHAT,
  },
  {
    label: "Reports",
    to: ROUTE_PATHS.REPORTS,
  },
  {
    label: "Settings",
    to: ROUTE_PATHS.SETTINGS,
  },
];

export function DashboardLayout() {
  const { theme, toggleTheme } = useThemeStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <TaskMinderLogo size="sm" subtitle="Workspace" />

        <WorkspaceSwitcher className="mt-6" />

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                  isActive &&
                    "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="hidden text-sm text-slate-500 sm:block">
                Project Collaboration Platform
              </p>

              <h1 className="truncate text-lg font-semibold">
                TaskMinder Workspace
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden w-60 sm:block lg:hidden">
                <WorkspaceSwitcher compact />
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Global search"
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden md:inline">Tìm nhanh</span>
                <kbd className="hidden rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline">
                  Ctrl+K
                </kbd>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Light/Dark theme"
                title={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span>{theme === "dark" ? "☀️" : "🌙"}</span>
                <span className="hidden sm:inline">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>

              <NotificationBellDropdown />

              <ProfileDropdown />
            </div>
          </div>

          <div className="mt-3 sm:hidden lg:hidden">
            <WorkspaceSwitcher compact />
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <GlobalSearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
