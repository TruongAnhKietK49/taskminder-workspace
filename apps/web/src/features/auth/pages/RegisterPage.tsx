import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useRegister } from "@/features/auth/hooks/useRegister";

export function RegisterPage() {
  const { form, error, isSubmitting, updateField, submit } = useRegister();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof typeof form;

    updateField(field, event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
      <div className="mb-6">
        <p className="text-sm text-slate-300">Create workspace faster</p>

        <h1 className="mt-1 text-2xl font-bold">Create your account</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Full name
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Nguyen Van A"
            autoComplete="name"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium"
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-950"
              />

              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            "Register"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-300">
        Already have an account?{" "}
        <Link
          to={ROUTE_PATHS.LOGIN}
          className="font-medium text-white underline underline-offset-4 hover:text-slate-200"
        >
          Login
        </Link>
      </p>
    </section>
  );
}
