import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useGlobalSearch } from "@/features/search/hooks/useGlobalSearch";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";

type GlobalSearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const [queryText, setQueryText] = useState("");

  const searchQuery = useGlobalSearch(activeWorkspaceId ?? undefined, queryText);
  const results = searchQuery.data;

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  function handleClose() {
    setQueryText("");
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQueryText("");
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function goTo(path: string) {
    setQueryText("");
    onClose();
    navigate(path);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-16 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Tìm dự án, công việc, bình luận, tin nhắn, thành viên..."
            className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {!activeWorkspaceId ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Vui lòng chọn một workspace để tìm kiếm.
            </p>
          ) : searchQuery.debouncedQuery.length < 2 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Nhập ít nhất 2 ký tự để tìm kiếm toàn workspace.
            </p>
          ) : searchQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Đang tìm kiếm...
            </p>
          ) : !results || results.totalCount === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Không tìm thấy kết quả phù hợp cho &ldquo;{searchQuery.debouncedQuery}&rdquo;.
            </p>
          ) : (
            <div className="space-y-4">
              {results.projects.length > 0 ? (
                <div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Dự án ({results.projects.length})
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          goTo(`${ROUTE_PATHS.TASKS}?projectId=${p.id}`)
                        }
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {p.name}
                          </p>
                          {p.description ? (
                            <p className="truncate text-xs text-slate-500">
                              {p.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {p.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.tasks.length > 0 ? (
                <div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Công việc ({results.tasks.length})
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          goTo(`${ROUTE_PATHS.TASKS}?projectId=${t.projectId}`)
                        }
                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {t.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            Dự án: {t.projectName}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                          {t.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.comments.length > 0 ? (
                <div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bình luận ({results.comments.length})
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.comments.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          goTo(`${ROUTE_PATHS.TASKS}?projectId=${c.projectId}`)
                        }
                        className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <p className="truncate text-sm text-slate-900">
                          {c.content}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {c.authorName} · trong task &ldquo;{c.taskTitle}&rdquo;
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.messages.length > 0 ? (
                <div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tin nhắn ({results.messages.length})
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.messages.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          goTo(
                            `${ROUTE_PATHS.CHAT}?conversationId=${m.conversationId}`,
                          )
                        }
                        className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <p className="truncate text-sm text-slate-900">
                          {m.content}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {m.senderName} · #{m.conversationName}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {results.members.length > 0 ? (
                <div>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Thành viên ({results.members.length})
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.members.map((m) => (
                      <button
                        key={m.memberId}
                        type="button"
                        onClick={() => goTo(ROUTE_PATHS.MEMBERS)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {m.fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {m.email}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {m.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
