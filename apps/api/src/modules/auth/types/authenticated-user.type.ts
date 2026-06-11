export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
