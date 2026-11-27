import { useState } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkspaceModal";
import { IncomingWorkspaceInvitationsBanner } from "@/features/workspaces/components/invitations/IncomingWorkspaceInvitationsBanner";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { WorkspaceMembersPanel } from "@/features/workspaces/components/WorkspaceMembersPanel";
import { WorkspaceSettingPanel } from "@/features/workspaces/components/WorkspaceSettingPanel";
import { WORKSPACE_ROLE_LABELS } from "@/features/workspaces/constants/workspace.constants";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { cn } from "@/shared/lib/cn";

type WorkspaceConsoleTab = "members" | "settings";

export function WorkspacesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceConsoleTab>("members");

  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    selectWorkspace,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useWorkspaceSelection();

  return (
    <>
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 py-4 text-white shadow-md shadow-blue-500/15">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                Workspaces
              </h2>

              {isFetching && !isLoading && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white">
                  Đang đồng bộ...
                </span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-xs text-blue-50 md:text-sm">
              Chuyển đổi không gian làm việc, quản lý thành viên, lời mời và cài
              đặt quyền truy cập.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-xs transition hover:bg-sky-50"
          >
            + Tạo workspace
          </button>
        </header>

        <IncomingWorkspaceInvitationsBanner />

        {isLoading && (
          <div className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-3 xl:col-span-4">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-8" />
          </div>
        )}

        {isError && workspaces.length === 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="font-semibold text-red-800">
              Không thể tải workspace
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {getApiErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </section>
        )}

        {!isLoading && !isError && workspaces.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-blue-600">
              W
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-950">
              Bạn chưa có workspace
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
              Tạo workspace đầu tiên để bắt đầu quản lý dự án, công việc và
              thành viên.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-blue-700 hover:to-sky-600"
            >
              + Tạo workspace đầu tiên
            </button>
          </section>
        )}

        {workspaces.length > 0 && (
          <div className="grid items-start gap-4 xl:grid-cols-12">
            {/* Left Column: Compact Workspace List */}
            <div className="space-y-2.5 xl:col-span-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Không gian làm việc ({workspaces.length})
                </p>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-1">
                {workspaces.map((workspace) => (
                  <WorkspaceCard
                    key={workspace.id}
                    workspace={workspace}
                    active={workspace.id === activeWorkspaceId}
                    onSelect={() => selectWorkspace(workspace.id)}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Tabbed Active Workspace Console */}
            {activeWorkspace ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-slate-950">
                        {activeWorkspace.name}
                      </h3>
                      <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        {WORKSPACE_ROLE_LABELS[activeWorkspace.currentUserRole]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {activeWorkspace.description ||
                        "Chưa có mô tả cho workspace này."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={ROUTE_PATHS.PROJECTS}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700"
                    >
                      Projects
                    </Link>
                    <Link
                      to={ROUTE_PATHS.TASKS}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700"
                    >
                      Tasks
                    </Link>
                  </div>
                </div>

                {/* Segmented Tabs */}
                <div className="flex gap-1 border-b border-slate-100 bg-slate-50/70 px-5 py-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
                      activeTab === "members"
                        ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-950",
                    )}
                  >
                    Thành viên &amp; Lời mời ({activeWorkspace.memberCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
                      activeTab === "settings"
                        ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-950",
                    )}
                  >
                    Cài đặt chung
                  </button>
                </div>

                {activeTab === "members" ? (
                  <WorkspaceMembersPanel workspace={activeWorkspace} embedded />
                ) : (
                  <WorkspaceSettingPanel
                    key={activeWorkspace.id}
                    workspace={activeWorkspace}
                    embedded
                  />
                )}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
