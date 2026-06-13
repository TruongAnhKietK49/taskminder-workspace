export function RouteGuardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-white" />

        <p className="text-sm text-slate-300">
          Đang kiểm tra phiên đăng nhập...
        </p>
      </div>
    </div>
  );
}
