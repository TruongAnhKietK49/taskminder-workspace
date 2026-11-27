import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useLogin } from "@/features/auth/hooks/useLogin";

export function LoginPage() {
  const location = useLocation();
  const { form, error, isSubmitting, updateField, submit } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof typeof form;
    updateField(field, event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function fillDemoAccount(email: string) {
    updateField("email", email);
    updateField("password", "TaskMinder@2026");
  }

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          Chào mừng trở lại
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Đăng nhập
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tiếp tục quản lý dự án và cộng tác cùng nhóm của bạn.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
          >
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="name@company.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-2.5 flex items-center rounded-lg px-1.5 text-slate-400 transition hover:text-slate-700"
            >
              {showPassword ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
          >
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      {/* Quick Demo Account Helper */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Điền nhanh tài khoản trải nghiệm
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("owner@taskminder.dev")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Owner (Kiệt)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("admin@taskminder.dev")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Admin (Minh Anh)
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("qa@taskminder.dev")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            QA (Có lời mời)
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Chưa có tài khoản?{" "}
        <Link
          to={ROUTE_PATHS.REGISTER}
          state={location.state}
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-cyan-400"
        >
          Đăng ký ngay
        </Link>
      </p>
    </section>
  );
}
