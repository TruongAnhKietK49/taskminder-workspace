import type {
  ConversationItem,
  PresenceStatus,
} from "@/features/chat/types/chat.types";

export const PRESENCE_META: Record<
  PresenceStatus,
  { label: string; dotClass: string }
> = {
  ONLINE: {
    label: "Đang hoạt động",
    dotClass: "bg-emerald-500",
  },
  AWAY: {
    label: "Tạm vắng",
    dotClass: "bg-amber-400",
  },
  BUSY: {
    label: "Đang bận",
    dotClass: "bg-red-500",
  },
  DO_NOT_DISTURB: {
    label: "Không làm phiền",
    dotClass: "bg-rose-600",
  },
  OFFLINE: {
    label: "Ngoại tuyến",
    dotClass: "bg-slate-400",
  },
};

export function getConversationDisplayName(
  conversation: ConversationItem,
  currentUserId: string | undefined,
): string {
  if (conversation.type === "WORKSPACE") {
    return `# ${conversation.name ?? "general"}`;
  }
  if (conversation.type === "PROJECT") {
    return `# ${conversation.name ?? "Dự án"}`;
  }

  const other =
    conversation.participants.find((p) => p.userId !== currentUserId) ??
    conversation.participants[0];
  return other?.user.fullName || other?.user.email || "Direct Message";
}

export function getDirectPeerId(
  conversation: ConversationItem,
  currentUserId: string | undefined,
): string | null {
  if (conversation.type !== "DIRECT") return null;
  const other =
    conversation.participants.find((p) => p.userId !== currentUserId) ??
    conversation.participants[0];
  return other?.userId ?? null;
}
