import { useToastStore, type ToastVariant } from "@/shared/stores/toast.store";

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success:
    "border-emerald-200 bg-white text-slate-900 dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-100",
  error:
    "border-red-200 bg-white text-slate-900 dark:border-red-800 dark:bg-slate-900 dark:text-slate-100",
  info: "border-blue-200 bg-white text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100",
};

const DOT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role="status"
          className={[
            "pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all",
            VARIANT_CLASSES[item.variant],
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={[
                "h-2.5 w-2.5 shrink-0 rounded-full",
                DOT_CLASSES[item.variant],
              ].join(" ")}
            />
            <span className="truncate">{item.message}</span>
          </div>

          <button
            type="button"
            onClick={() => removeToast(item.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
