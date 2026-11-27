import { create } from "zustand";
import type {
  TypingUser,
  UserPresenceItem,
} from "@/features/chat/types/chat.types";

export type SocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

type RealtimeState = {
  connectionStatus: SocketConnectionStatus;
  myPresence: UserPresenceItem | null;
  presencesByUserId: Record<string, UserPresenceItem>;
  typingByConversationId: Record<string, TypingUser[]>;
  activeConversationId: string | null;

  setConnectionStatus: (status: SocketConnectionStatus) => void;
  setMyPresence: (presence: UserPresenceItem | null) => void;
  upsertPresence: (presence: UserPresenceItem) => void;
  setWorkspacePresences: (presences: UserPresenceItem[]) => void;
  setTypingUser: (
    conversationId: string,
    user: TypingUser,
    isTyping: boolean,
  ) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  reset: () => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connectionStatus: "disconnected",
  myPresence: null,
  presencesByUserId: {},
  typingByConversationId: {},
  activeConversationId: null,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setMyPresence: (myPresence) =>
    set((state) => ({
      myPresence,
      presencesByUserId: myPresence
        ? { ...state.presencesByUserId, [myPresence.userId]: myPresence }
        : state.presencesByUserId,
    })),

  upsertPresence: (presence) =>
    set((state) => ({
      presencesByUserId: {
        ...state.presencesByUserId,
        [presence.userId]: presence,
      },
      myPresence:
        state.myPresence?.userId === presence.userId
          ? presence
          : state.myPresence,
    })),

  setWorkspacePresences: (presences) =>
    set((state) => {
      const next = { ...state.presencesByUserId };
      for (const item of presences) {
        next[item.userId] = item;
      }
      return { presencesByUserId: next };
    }),

  setTypingUser: (conversationId, user, isTyping) =>
    set((state) => {
      const current = state.typingByConversationId[conversationId] ?? [];
      const filtered = current.filter((item) => item.userId !== user.userId);
      const nextList = isTyping ? [...filtered, user] : filtered;
      return {
        typingByConversationId: {
          ...state.typingByConversationId,
          [conversationId]: nextList,
        },
      };
    }),

  setActiveConversationId: (activeConversationId) =>
    set({ activeConversationId }),

  reset: () =>
    set({
      connectionStatus: "disconnected",
      myPresence: null,
      presencesByUserId: {},
      typingByConversationId: {},
      activeConversationId: null,
    }),
}));
