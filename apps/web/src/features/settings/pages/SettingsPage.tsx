import { type FormEvent, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettings,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationSettings } from "@/features/notifications/types/notification.types";
import { useProjectsQuery } from "@/features/projects/hooks/useProjects";
import type { Project } from "@/features/projects/types/project.types";
import { useWorkspaceSelection } from "@/features/workspaces/hooks/useWorkspaceSelection";
import { useThemeStore } from "@/shared/stores/theme.store";
import { toast } from "@/shared/stores/toast.store";

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { activeWorkspace, activeWorkspaceId } = useWorkspaceSelection();
  const { theme, setTheme } = useThemeStore();

  const settingsQuery = useNotificationSettingsQuery();
  const projectsQuery = useProjectsQuery(activeWorkspaceId);

  const projects = projectsQuery.data ?? [];

  function handleSelectTheme(nextTheme: "light" | "dark") {
    if (theme === nextTheme) {
      return;
    }
    setTheme(nextTheme);
    toast.info(
      nextTheme === "dark"
        ? "Đã chuyển sang giao diện Tối."
        : "Đã chuyển sang giao diện Sáng.",
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
          Preferences
        </p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Tùy chỉnh giao diện Sáng / Tối, cấu hình nhận thông báo, Do Not
          Disturb, Quiet Hours và tắt tiếng theo từng project.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Appearance (Giao diện)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Chọn chế độ hiển thị Sáng hoặc Tối cho toàn bộ ứng dụng.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSelectTheme("light")}
            className={[
              "rounded-2xl border p-4 text-left transition",
              theme === "light"
                ? "border-blue-400 bg-blue-50/70 ring-4 ring-blue-100"
                : "border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-semibold text-slate-950">
              ☀️ Light Mode (Sáng)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nền sáng tương phản cao, phù hợp làm việc ban ngày.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTheme("dark")}
            className={[
              "rounded-2xl border p-4 text-left transition",
              theme === "dark"
                ? "border-blue-400 bg-blue-950/30 ring-4 ring-blue-900/40"
                : "border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            <p className="text-sm font-semibold text-slate-950">
              🌙 Dark Mode (Tối)
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Nền tối dịu mắt, giảm chói khi làm việc ban đêm.
            </p>
          </button>
        </div>
      </section>

      {settingsQuery.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      ) : settingsQuery.data ? (
        <NotificationPreferencesForm
          key={settingsQuery.data.updatedAt}
          initialSettings={settingsQuery.data}
          projects={projects}
        />
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Account</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <p className="text-xs text-slate-500">Full name</p>
            <p className="mt-1 font-semibold text-slate-900">
              {currentUser?.fullName ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <p className="text-xs text-slate-500">Email</p>
            <p className="mt-1 font-semibold text-slate-900">
              {currentUser?.email ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <p className="text-xs text-slate-500">Active workspace</p>
            <p className="mt-1 font-semibold text-slate-900">
              {activeWorkspace
                ? `${activeWorkspace.name} (${activeWorkspace.currentUserRole})`
                : "None"}
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

function NotificationPreferencesForm({
  initialSettings,
  projects,
}: {
  initialSettings: NotificationSettings;
  projects: Project[];
}) {
  const updateSettingsMutation = useUpdateNotificationSettings();

  const [taskUpdatesEnabled, setTaskUpdatesEnabled] = useState(
    initialSettings.taskUpdatesEnabled,
  );
  const [remindersEnabled, setRemindersEnabled] = useState(
    initialSettings.remindersEnabled,
  );
  const [chatEnabled, setChatEnabled] = useState(initialSettings.chatEnabled);
  const [emailEnabled, setEmailEnabled] = useState(
    initialSettings.emailEnabled,
  );
  const [doNotDisturb, setDoNotDisturb] = useState(
    initialSettings.doNotDisturb,
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    initialSettings.quietHoursEnabled,
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    initialSettings.quietHoursStart ?? "22:00",
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    initialSettings.quietHoursEnd ?? "07:00",
  );
  const [mutedProjectIds, setMutedProjectIds] = useState<string[]>(
    initialSettings.mutedProjectIds,
  );

  function toggleMutedProject(projectId: string) {
    setMutedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettingsMutation.mutate({
      taskUpdatesEnabled,
      remindersEnabled,
      chatEnabled,
      emailEnabled,
      doNotDisturb,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      mutedProjectIds,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Notification Preferences
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Kiểm soát loại thông báo muốn nhận và khung giờ yên lặng.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm">
          <span className="font-medium text-slate-800">Task updates</span>
          <input
            type="checkbox"
            checked={taskUpdatesEnabled}
            onChange={(event) => setTaskUpdatesEnabled(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm">
          <span className="font-medium text-slate-800">Deadline reminders</span>
          <input
            type="checkbox"
            checked={remindersEnabled}
            onChange={(event) => setRemindersEnabled(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm">
          <span className="font-medium text-slate-800">Chat messages</span>
          <input
            type="checkbox"
            checked={chatEnabled}
            onChange={(event) => setChatEnabled(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm">
          <span className="font-medium text-slate-800">Email digest</span>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(event) => setEmailEnabled(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 text-sm">
          <div>
            <p className="font-semibold text-slate-900">Do Not Disturb (DND)</p>
            <p className="text-xs text-slate-500">
              Tạm dừng toàn bộ thông báo mới cho đến khi bạn tắt chế độ này.
            </p>
          </div>
          <input
            type="checkbox"
            checked={doNotDisturb}
            onChange={(event) => setDoNotDisturb(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </label>

        <div className="rounded-xl border border-slate-200 p-3.5">
          <label className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-slate-900">Quiet Hours</p>
              <p className="text-xs text-slate-500">
                Tự động tắt thông báo trong khung giờ nghỉ ngơi.
              </p>
            </div>
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(event) => setQuietHoursEnabled(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </label>

          {quietHoursEnabled ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  Start time
                </label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(event) => setQuietHoursStart(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  End time
                </label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(event) => setQuietHoursEnd(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-900">Mute Projects</p>
          <p className="text-xs text-slate-500">
            Tắt thông báo từ các project đã chọn (vẫn nhận thông báo khi có
            người @mention trực tiếp bạn).
          </p>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            {projects.map((project) => (
              <label
                key={project.id}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={mutedProjectIds.includes(project.id)}
                  onChange={() => toggleMutedProject(project.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="truncate">{project.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={updateSettingsMutation.isPending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {updateSettingsMutation.isPending
            ? "Saving..."
            : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
