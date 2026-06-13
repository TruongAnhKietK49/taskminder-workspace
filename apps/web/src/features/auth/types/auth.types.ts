export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthSessionData = {
  user: AuthUser;
  accessToken: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data: AuthSessionData;
};

export type CurrentUserResponse = {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
  };
};

export type LogoutResponse = {
  success: boolean;
  message: string;
  data: null;
};
