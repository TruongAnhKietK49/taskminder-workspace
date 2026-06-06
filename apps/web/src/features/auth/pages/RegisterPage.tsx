import { Link } from "react-router-dom";

export function RegisterPage() {
  return (
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
      <div className="mb-6">
        <p className="text-sm text-slate-300">Create workspace faster</p>
        <h1 className="mt-1 text-2xl font-bold">Create your account</h1>
      </div>

      <form className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Nguyen Van A"
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white px-3 py-2 text-slate-950 outline-none"
          />
        </div>

        <button
          type="button"
          className="w-full rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          Register
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-300">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-white underline">
          Login
        </Link>
      </p>
    </section>
  );
}
