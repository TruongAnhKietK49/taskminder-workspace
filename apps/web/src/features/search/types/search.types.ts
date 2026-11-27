export type SearchProjectHit = {
  id: string;
  name: string;
  status: string;
  description: string | null;
};

export type SearchTaskHit = {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
};

export type SearchCommentHit = {
  id: string;
  content: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  authorName: string;
};

export type SearchMessageHit = {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
  conversationName: string;
  conversationType: "WORKSPACE" | "PROJECT" | "DIRECT";
  senderName: string;
};

export type SearchMemberHit = {
  memberId: string;
  role: string;
  userId: string;
  fullName: string;
  email: string;
};

export type GlobalSearchResponse = {
  query: string;
  totalCount: number;
  projects: SearchProjectHit[];
  tasks: SearchTaskHit[];
  comments: SearchCommentHit[];
  messages: SearchMessageHit[];
  members: SearchMemberHit[];
};
