import { NavLink, Outlet } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { ProfileDropdown } from "@/features/auth/components/ProfileDropdown";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";
import { cn } from "@/shared/lib/cn";

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
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <div>
          <p className="text-lg font-bold">TaskMinder</p>
          <p className="text-sm text-slate-500">Workspace</p>
        </div>

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
    </div>
  );
}
