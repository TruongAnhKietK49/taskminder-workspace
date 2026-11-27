import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useRegister } from "@/features/auth/hooks/useRegister";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  barClass: string;
  textClass: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: "Yếu",
      barClass: "bg-red-500",
      textClass: "text-red-500",
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: "Trung bình",
      barClass: "bg-amber-500",
      textClass: "text-amber-500",
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: "Khá mạnh",
      barClass: "bg-blue-500",
      textClass: "text-blue-500",
    };
  }
  return {
    score: 4,
    label: "Rất mạnh",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-600",
  };
}

export function RegisterPage() {
  const location = useLocation();
  const { form, error, isSubmitting, updateField, submit } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof typeof form;
    updateField(field, event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  const strength = getPasswordStrength(form.password);
  const hasConfirmInput = form.confirmPassword.length > 0;
  const passwordsMatch = form.password === form.confirmPassword;

  return (
    <section className="w-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-blue-950/5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-sky-300">
          Tạo tài khoản miễn phí
        </span>
        <h2 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Đăng ký tài khoản
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tạo không gian làm việc và mời thành viên chỉ trong vài bước.
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
          >
            Họ và tên
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
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>
        </div>

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
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
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
              placeholder="Tối thiểu 8 ký tự"
              autoComplete="new-password"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-2.5 flex items-center rounded-lg px-1.5 text-slate-400 transition hover:text-slate-700"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {form.password.length > 0 ? (
            <div className="mt-2 space-y-1">
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={[
                      "h-1.5 rounded-full transition-colors",
                      segment <= strength.score
                        ? strength.barClass
                        : "bg-slate-200 dark:bg-slate-700",
                    ].join(" ")}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Độ mạnh mật khẩu:{" "}
                <span className={["font-semibold", strength.textClass].join(" ")}>
                  {strength.label}
                </span>
              </p>
            </div>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
          >
            Xác nhận mật khẩu
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
              }
              className="absolute inset-y-0 right-2.5 flex items-center rounded-lg px-1.5 text-slate-400 transition hover:text-slate-700"
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {hasConfirmInput ? (
            <p
              className={[
                "mt-1 text-[11px] font-medium",
                passwordsMatch ? "text-emerald-600" : "text-red-500",
              ].join(" ")}
            >
              {passwordsMatch
                ? "✓ Mật khẩu xác nhận khớp"
                : "✗ Mật khẩu xác nhận chưa khớp"}
            </p>
          ) : null}
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
          >
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            "Đăng ký tài khoản"
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Đã có tài khoản?{" "}
        <Link
          to={ROUTE_PATHS.LOGIN}
          state={location.state}
          className="font-semibold text-blue-600 hover:text-blue-700 dark:text-cyan-400"
        >
          Đăng nhập
        </Link>
      </p>
    </section>
  );
}
