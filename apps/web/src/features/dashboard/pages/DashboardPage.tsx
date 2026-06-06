import { PagePlaceholder } from "@/shared/components/PagePlaceholder";
import { useHealthCheck } from "../hooks/useHealthCheck";

export function DashboardPage() {
  const { data, isLoading, isError, error } = useHealthCheck();
  return (
    <div className="space-y-4">
      <PagePlaceholder
        title="Dashboard"
        description="Overview workspace activity, assigned tasks, upcoming deadlines, unread notifications, and team productivity summary."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-500">System Status</p>
          <h3 className="text-xl font-semibold">Backend Health Check</h3>
        </div>

        {isLoading && (
          <p className="text-sm text-slate-500">
            Checking backend connection...
          </p>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Cannot connect to backend API.
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {error instanceof Error ? error.message : "Unknown error"}
            </pre>
          </div>
        )}

        {data && (
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500">API Status</p>
              <p className="mt-1 font-semibold text-emerald-600">
                {data.status}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500">Service</p>
              <p className="mt-1 font-semibold">{data.service}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500">Database</p>
              <p className="mt-1 font-semibold text-emerald-600">
                {data.database}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-slate-500">Checked At</p>
              <p className="mt-1 font-semibold">
                {new Date(data.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
