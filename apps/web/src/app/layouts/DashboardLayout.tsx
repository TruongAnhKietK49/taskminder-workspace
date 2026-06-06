import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/shared/lib/cn";

const navigationItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Workspaces",
    to: "/workspaces",
  },
  {
    label: "Projects",
    to: "/projects",
  },
  {
    label: "Members",
    to: "/members",
  },
  {
    label: "Tasks",
    to: "/tasks",
  },
  {
    label: "Notifications",
    to: "/notifications",
  },
  {
    label: "Chat",
    to: "/chat",
  },
  {
    label: "Reports",
    to: "/reports",
  },
  {
    label: "Settings",
    to: "/settings",
  },
];

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 lg:block">
        <div className="mb-8">
          <p className="text-lg font-bold">TaskMinder</p>
          <p className="text-sm text-slate-500">Workspace</p>
        </div>

        <nav className="space-y-1">
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
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Project Collaboration Platform
              </p>
              <h1 className="text-lg font-semibold">TaskMinder Workspace</h1>
            </div>

            <button
              type="button"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              User Menu
            </button>
          </div>
        </header>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
