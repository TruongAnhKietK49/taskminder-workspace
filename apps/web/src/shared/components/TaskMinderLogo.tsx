import { useId } from "react";

type TaskMinderLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  subtitle?: string;
  tone?: "auto" | "light" | "dark";
  className?: string;
};

const ICON_SIZES = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

const TITLE_SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
} as const;

export function TaskMinderLogo({
  size = "md",
  showWordmark = true,
  subtitle,
  tone = "auto",
  className = "",
}: TaskMinderLogoProps) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const bgGradientId = `tm-bg-${safeId}`;
  const accentGradientId = `tm-accent-${safeId}`;

  const titleColor =
    tone === "light"
      ? "text-white"
      : tone === "dark"
        ? "text-slate-950"
        : "text-slate-950 dark:text-white";

  const accentColor =
    tone === "light"
      ? "text-cyan-300"
      : tone === "dark"
        ? "text-blue-600"
        : "text-blue-600 dark:text-cyan-400";

  const subtitleColor =
    tone === "light"
      ? "text-slate-300"
      : tone === "dark"
        ? "text-slate-500"
        : "text-slate-500 dark:text-slate-400";

  return (
    <div className={["inline-flex items-center gap-3", className].join(" ")}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={[ICON_SIZES[size], "shrink-0 drop-shadow-md"].join(" ")}
      >
        <defs>
          <linearGradient
            id={bgGradientId}
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient
            id={accentGradientId}
            x1="14"
            y1="14"
            x2="36"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
        </defs>

        <rect
          x="2"
          y="2"
          width="44"
          height="44"
          rx="13"
          fill={`url(#${bgGradientId})`}
        />
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          stroke="white"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />

        {/* Stylized T-bar + workspace tile */}
        <path
          d="M12.5 15.5C12.5 14.1193 13.6193 13 15 13H31C32.3807 13 33.5 14.1193 33.5 15.5C33.5 16.8807 32.3807 18 31 18H24.5V32.5C24.5 33.8807 23.3807 35 22 35C20.6193 35 19.5 33.8807 19.5 32.5V18H15C13.6193 18 12.5 16.8807 12.5 15.5Z"
          fill={`url(#${accentGradientId})`}
        />

        {/* Dynamic checkmark / spark */}
        <path
          d="M26.5 28.5L30 32L37 23.5"
          stroke="#67E8F9"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark ? (
        <div className="min-w-0 leading-tight">
          <p
            className={[
              TITLE_SIZES[size],
              "truncate font-extrabold tracking-tight",
              titleColor,
            ].join(" ")}
          >
            Task<span className={accentColor}>Minder</span>
          </p>
          {subtitle ? (
            <p
              className={[
                "truncate text-xs font-medium",
                subtitleColor,
              ].join(" ")}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
