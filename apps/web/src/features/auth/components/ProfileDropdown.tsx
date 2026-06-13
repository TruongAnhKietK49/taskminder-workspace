import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";

function getInitials(fullName: string): string {
  const normalizedName = fullName.trim();

  if (!normalizedName) {
    return "U";
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function ProfileDropdown() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();

      navigate(ROUTE_PATHS.LOGIN, {
        replace: true,
      });
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-lg border border-slate-200 px-2 py-1.5 text-left transition hover:bg-slate-100"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(user.fullName)
          )}
        </div>

        <div className="hidden max-w-44 sm:block">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.fullName}
          </p>

          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>

        <span
          aria-hidden="true"
          className={`hidden text-xs text-slate-500 transition-transform sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.fullName}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                navigate(ROUTE_PATHS.SETTINGS);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Cài đặt tài khoản
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
