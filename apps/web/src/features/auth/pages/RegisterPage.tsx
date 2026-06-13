import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";

type RegisterFormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: RegisterFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterPage() {
  const navigate = useNavigate();

  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState<RegisterFormState>(initialFormState);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmitting = status === "loading";

  useEffect(() => {
    clearError();

    return () => {
      clearError();
    };
  }, [clearError]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (validationError) {
      setValidationError(null);
    }

    if (authError) {
      clearError();
    }
  }

  function validateForm(): string | null {
    const normalizedName = form.fullName.trim();
    const normalizedEmail = form.email.trim();

    if (normalizedName.length < 2) {
      return "Họ tên phải có ít nhất 2 ký tự.";
    }

    if (!normalizedEmail) {
      return "Vui lòng nhập email.";
    }

    if (!normalizedEmail.includes("@")) {
      return "Email không hợp lệ.";
    }

    if (form.password.length < 8) {
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    }

    if (form.password.length > 72) {
      return "Mật khẩu không được vượt quá 72 ký tự.";
    }

    if (form.password !== form.confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorMessage = validateForm();

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate(ROUTE_PATHS.DASHBOARD, {
        replace: true,
      });
    } catch {
      // Error đã được Auth Store xử lý.
    }
  }

  const displayedError = validationError ?? authError;

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

        {displayedError && (
          <div
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          >
            {displayedError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-950" />
              Đang tạo tài khoản...
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
          className="font-medium text-white underline"
        >
          Login
        </Link>
      </p>
    </section>
  );
}
