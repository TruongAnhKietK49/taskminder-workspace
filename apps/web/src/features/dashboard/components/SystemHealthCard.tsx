import { useHealthCheck } from "@/features/dashboard/hooks/useHealthCheck";

export function SystemHealthCard() {
  const { data, isLoading, isError, error } = useHealthCheck();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            System Status
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
            Backend Health Check
          </h2>
        </div>

        {data ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </span>
        ) : isError ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Offline
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500">
          Checking backend connection...
        </p>
      ) : null}

      {isError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Cannot connect to backend API.
          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>
      ) : null}

      {data ? (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">API Status</p>
            <p className="mt-1 font-semibold text-emerald-600">{data.status}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Service</p>
            <p className="mt-1 font-semibold text-slate-900">{data.service}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Database</p>
            <p className="mt-1 font-semibold text-emerald-600">
              {data.database}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="text-xs font-medium text-slate-500">Checked At</p>
            <p className="mt-1 font-semibold text-slate-900">
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
