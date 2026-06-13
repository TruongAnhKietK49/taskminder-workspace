import { useState } from "react";

import { CreateWorkspaceModal } from "@/features/workspaces/components/CreateWorkspaceModal";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { WorkspaceSettingPanel } from "@/features/workspaces/components/WorkspaceSettingPanel";
import { WorkspaceMembersPanel } from "@/features/workspaces/components/WorkspaceMembersPanel";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function WorkspacesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Workspaces
              </h2>

              {isFetching && !isLoading && (
                <span className="text-xs text-slate-400">Đang đồng bộ...</span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Chuyển đổi không gian làm việc, quản lý thông tin và theo dõi
              quyền truy cập của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + Tạo workspace
          </button>
        </header>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {isError && workspaces.length === 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="font-semibold text-red-800">
              Không thể tải workspace
            </h3>

            <p className="mt-2 text-sm text-red-700">
              {getApiErrorMessage(error)}
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </section>
        )}

        {!isLoading && !isError && workspaces.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              W
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-950">
              Bạn chưa có workspace
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Tạo workspace đầu tiên để bắt đầu quản lý dự án, task và thành
              viên.
            </p>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tạo workspace đầu tiên
            </button>
          </section>
        )}

        {workspaces.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  active={workspace.id === activeWorkspaceId}
                  onSelect={() => selectWorkspace(workspace.id)}
                />
              ))}
            </div>

            {activeWorkspace && (
              <div className="space-y-6">
                <WorkspaceSettingPanel workspace={activeWorkspace} />

                <WorkspaceMembersPanel workspace={activeWorkspace} />
              </div>
            )}
          </>
        )}
      </section>

      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
