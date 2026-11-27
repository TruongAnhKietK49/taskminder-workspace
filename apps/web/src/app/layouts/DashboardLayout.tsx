import { type ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { ProfileDropdown } from "@/features/auth/components/ProfileDropdown";
import { NotificationBellDropdown } from "@/features/notifications/components/NotificationBellDropdown";
import { GlobalSearchModal } from "@/features/search/components/GlobalSearchModal";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";
import { TaskMinderLogo } from "@/shared/components/TaskMinderLogo";
import { cn } from "@/shared/lib/cn";
import { useThemeStore } from "@/shared/stores/theme.store";

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    to: ROUTE_PATHS.DASHBOARD,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: "Workspaces",
    to: ROUTE_PATHS.WORKSPACES,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
        <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
        <path d="M12 3v6" />
      </svg>
    ),
  },
  {
    label: "Projects",
    to: ROUTE_PATHS.PROJECTS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
    ),
  },
  {
    label: "Tasks",
    to: ROUTE_PATHS.TASKS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Members",
    to: ROUTE_PATHS.MEMBERS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Chat",
    to: ROUTE_PATHS.CHAT,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    to: ROUTE_PATHS.NOTIFICATIONS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    label: "Reports",
    to: ROUTE_PATHS.REPORTS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    label: "Settings",
    to: ROUTE_PATHS.SETTINGS,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
];

export function DashboardLayout() {
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const activeNav = navigationItems.find((item) =>
    location.pathname.startsWith(item.to),
  );

  return (
    <div className="min-h-screen bg-[#f3f7fc] text-slate-950 dark:bg-[#09101f]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-slate-200/90 bg-white px-3.5 py-4 lg:flex">
        <TaskMinderLogo size="sm" subtitle="Workspace" />

        <WorkspaceSwitcher className="mt-4" />

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-blue-700",
                  isActive &&
                    "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm shadow-blue-500/25 hover:from-blue-600 hover:to-sky-500 hover:text-white",
                )
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-[11px] text-slate-500">
          <p className="font-semibold text-blue-700 dark:text-sky-400">
            Mẹo nhanh
          </p>
          <p className="mt-0.5">
            Nhấn <kbd className="font-semibold">Ctrl+K</kbd> để tìm kiếm toàn
            hệ thống.
          </p>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <aside className="flex h-full w-64 flex-col bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <TaskMinderLogo size="sm" subtitle="Workspace" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <WorkspaceSwitcher className="mt-4" />
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-blue-700",
                      isActive &&
                        "bg-gradient-to-r from-blue-600 to-sky-500 text-white",
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-56">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="3" x2="21" y1="12" y2="12" />
                  <line x1="3" x2="21" y1="18" y2="18" />
                </svg>
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-950">
                  {activeNav?.label ?? "TaskMinder Workspace"}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden w-52 sm:block lg:hidden">
                <WorkspaceSwitcher compact />
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Global search"
                className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:bg-sky-50"
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
                <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline">
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
                className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-sky-50"
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
        </header>

        <main className="mx-auto max-w-[1440px] p-3.5 md:p-5">
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
