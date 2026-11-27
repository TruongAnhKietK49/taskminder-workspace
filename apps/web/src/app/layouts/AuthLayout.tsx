import { Outlet } from "react-router-dom";

import { TaskMinderLogo } from "@/shared/components/TaskMinderLogo";
import { useThemeStore } from "@/shared/stores/theme.store";

export function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="grid min-h-screen lg:grid-cols-12">
      {/* Left Brand Showcase Panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-8 text-white lg:col-span-6 lg:flex xl:col-span-7 xl:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl"
        />

        <div className="relative z-10">
          <TaskMinderLogo
            size="lg"
            tone="light"
            subtitle="Project Collaboration Platform"
          />
        </div>

        <div className="relative z-10 my-auto max-w-xl space-y-6 py-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
              Workspace · Kanban · Realtime Chat · Reports
            </span>
            <h1 className="mt-3.5 text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
              Điều phối công việc, đồng bộ đội nhóm theo thời gian thực.
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-blue-50/90 xl:text-base">
              Quản lý nhiều không gian làm việc với phân quyền RBAC chặt chẽ,
              bảng Kanban trực quan, trò chuyện Socket.IO tức thì và báo cáo
              tiến độ chuyên sâu.
            </p>
          </div>

          {/* Glassmorphic Preview Card */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <p className="text-xs font-semibold text-cyan-100">
                  TaskMinder Workspace
                </p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  Tổng quan tiến độ &amp; cộng tác
                </p>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                Realtime Sync
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-[11px] text-blue-100">Kanban Board</p>
                <p className="mt-0.5 text-base font-bold text-white">
                  Trực quan
                </p>
                <p className="mt-0.5 text-[11px] text-cyan-100">
                  Kéo thả &amp; lọc nhanh
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-[11px] text-blue-100">Socket.IO Chat</p>
                <p className="mt-0.5 text-base font-bold text-white">Tức thì</p>
                <p className="mt-0.5 text-[11px] text-cyan-100">
                  Online Presence
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-[11px] text-blue-100">Analytics</p>
                <p className="mt-0.5 text-base font-bold text-white">
                  CSV &amp; Audit
                </p>
                <p className="mt-0.5 text-[11px] text-cyan-100">
                  Tìm nhanh Ctrl+K
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-100/90">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1">
              Multi-Workspace RBAC
            </span>
            <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1">
              Socket.IO Presence
            </span>
            <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1">
              CSV &amp; Audit Logs
            </span>
          </div>
          <span>© 2026 TaskMinder Workspace</span>
        </div>
      </section>

      {/* Right Auth Form Panel */}
      <section className="relative flex flex-col justify-between bg-[#f3f7fc] px-4 py-5 dark:bg-[#09101f] sm:px-8 lg:col-span-6 xl:col-span-5">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <TaskMinderLogo size="md" subtitle="Workspace" />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark theme"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-4">
          <Outlet />
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 lg:hidden">
          © 2026 TaskMinder Workspace
        </p>
      </section>
    </main>
  );
}
