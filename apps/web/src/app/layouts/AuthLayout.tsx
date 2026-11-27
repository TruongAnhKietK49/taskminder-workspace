import { Outlet } from "react-router-dom";

import { TaskMinderLogo } from "@/shared/components/TaskMinderLogo";
import { useThemeStore } from "@/shared/stores/theme.store";

export function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="grid min-h-screen lg:grid-cols-12">
      {/* Left Brand Showcase Panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-10 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl"
        />

        <div className="relative z-10">
          <TaskMinderLogo
            size="lg"
            tone="light"
            subtitle="Project Collaboration Platform"
          />
        </div>

        <div className="relative z-10 my-auto max-w-xl space-y-8 py-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Workspace · Kanban · Realtime Chat · Reports
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
              Điều phối công việc, đồng bộ đội nhóm theo thời gian thực.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 xl:text-base">
              Quản lý nhiều không gian làm việc với phân quyền RBAC chặt chẽ,
              bảng Kanban trực quan, trò chuyện Socket.IO tức thì và báo cáo
              tiến độ chuyên sâu.
            </p>
          </div>

          {/* Glassmorphic Preview Card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-semibold text-cyan-300">
                  TaskMinder Core Engineering
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  Sprint Release Overview
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                92% On Track
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Kanban Tasks</p>
                <p className="mt-1 text-lg font-bold text-white">18 Active</p>
                <p className="mt-0.5 text-[11px] text-emerald-300">
                  +6 hoàn thành
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Realtime Chat</p>
                <p className="mt-1 text-lg font-bold text-white">Live Sync</p>
                <p className="mt-0.5 text-[11px] text-cyan-300">
                  Multi-tab online
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] text-slate-400">Analytics</p>
                <p className="mt-1 text-lg font-bold text-white">CSV & Audit</p>
                <p className="mt-0.5 text-[11px] text-indigo-300">
                  Ctrl+K Search
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
              Multi-Workspace RBAC
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
              Socket.IO Presence
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1">
              CSV & Audit Logs
            </span>
          </div>
          <span>© 2026 TaskMinder Workspace</span>
        </div>
      </section>

      {/* Right Auth Form Panel */}
      <section className="relative flex flex-col justify-between bg-slate-50 px-4 py-6 dark:bg-[#0b1120] sm:px-8 lg:col-span-6 xl:col-span-5">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <TaskMinderLogo size="md" subtitle="Workspace" />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark theme"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-6">
          <Outlet />
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 lg:hidden">
          © 2026 TaskMinder Workspace
        </p>
      </section>
    </main>
  );
}
