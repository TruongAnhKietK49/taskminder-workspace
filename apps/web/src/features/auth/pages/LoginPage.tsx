import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useLogin } from "@/features/auth/hooks/useLogin";

export function LoginPage() {
  const { form, error, isSubmitting, updateField, submit } = useLogin();

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
        <p className="text-sm text-slate-300">Welcome back</p>

        <h1 className="mt-1 text-2xl font-bold">Login to TaskMinder</h1>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
            disabled={isSubmitting}
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950"
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
            disabled={isSubmitting}
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 disabled:opacity-70"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-300">
        Don&apos;t have an account?{" "}
        <Link
          to={ROUTE_PATHS.REGISTER}
          className="font-medium text-white underline"
        >
          Register
        </Link>
      </p>
    </section>
  );
}
