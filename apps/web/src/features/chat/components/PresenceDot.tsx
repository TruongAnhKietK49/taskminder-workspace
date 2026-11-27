import type { PresenceStatus } from "@/features/chat/types/chat.types";
import { PRESENCE_META } from "@/features/chat/utils/chat-helpers";

type PresenceDotProps = {
  status: PresenceStatus;
  size?: "sm" | "md";
  className?: string;
};

export function PresenceDot({
  status,
  size = "sm",
  className = "",
}: PresenceDotProps) {
  const meta = PRESENCE_META[status] ?? PRESENCE_META.OFFLINE;
  const sizeClass = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";

  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={[
        "inline-block shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900",
        sizeClass,
        meta.dotClass,
        className,
      ].join(" ")}
    />
  );
}
