export type ConversationType = "WORKSPACE" | "PROJECT" | "DIRECT";

export type MessageType = "TEXT" | "SYSTEM";

export type PresenceStatus =
  | "ONLINE"
  | "AWAY"
  | "BUSY"
  | "DO_NOT_DISTURB"
  | "OFFLINE";

export type UserPresenceItem = {
  userId: string;
  status: PresenceStatus;
  statusMessage: string | null;
  lastActiveAt: string;
};

export type ChatUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
};

export type ConversationParticipant = {
  userId: string;
  lastReadAt: string | null;
  user: ChatUser;
};

export type ConversationItem = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  type: ConversationType;
  name: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
  participants: ConversationParticipant[];
};

export type MessagesPageResponse = {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type TypingUser = {
  userId: string;
  fullName: string;
};
