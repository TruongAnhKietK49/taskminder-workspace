import { Link, useNavigate, useParams } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import {
  useAcceptWorkspaceInvitation,
  useRejectWorkspaceInvitation,
} from "@/features/workspaces/hooks/useWorkspaceInvitations";
import { useWorkspaceStore } from "@/features/workspaces/stores/workspace.store";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function AcceptWorkspaceInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const setActiveWorkspaceId = useWorkspaceStore(
    (state) => state.setActiveWorkspaceId,
  );

  const acceptMutation = useAcceptWorkspaceInvitation();
  const rejectMutation = useRejectWorkspaceInvitation();

  async function handleAccept() {
    if (!token) {
      return;
    }

    try {
      const member = await acceptMutation.mutateAsync(token);

      if (member.workspaceId) {
        setActiveWorkspaceId(member.workspaceId);
      }

      navigate(ROUTE_PATHS.PROJECTS, {
        replace: true,
      });
    } catch {
      // Mutation giữ lỗi để render.
    }
  }

  async function handleReject() {
    if (!token) {
      return;
    }

    try {
      await rejectMutation.mutateAsync(token);

      navigate(ROUTE_PATHS.WORKSPACES, {
        replace: true,
      });
    } catch {
      // Mutation giữ lỗi để render.
    }
  }

  const isBusy = acceptMutation.isPending || rejectMutation.isPending;

  const error =
    acceptMutation.isError || rejectMutation.isError
      ? getApiErrorMessage(
          acceptMutation.error ?? rejectMutation.error,
          "Không thể xử lý lời mời.",
        )
      : null;

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        ✉️
      </div>

      <h1 className="mt-5 text-2xl font-bold text-slate-950">
        Lời mời tham gia workspace
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        Accept lời mời để được thêm vào workspace. Sau khi accept, hệ thống sẽ
        chuyển bạn sang trang Projects của workspace đó.
      </p>

      {!token && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Link lời mời không hợp lệ.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void handleAccept()}
          disabled={!token || isBusy}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {acceptMutation.isPending ? "Đang accept..." : "Accept invite"}
        </button>

        <button
          type="button"
          onClick={() => void handleReject()}
          disabled={!token || isBusy}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rejectMutation.isPending ? "Đang từ chối..." : "Reject"}
        </button>
      </div>

      <Link
        to={ROUTE_PATHS.WORKSPACES}
        className="mt-6 inline-block text-sm font-medium text-slate-500 hover:text-slate-950"
      >
        Quay lại Workspaces
      </Link>
    </section>
  );
}
