import { apiClient } from "@/shared/lib/api-client";
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginPayload,
  LogoutResponse,
  RegisterPayload,
} from "@/features/auth/types/auth.types";

export const authService = {
  async login(payload: LoginPayload) {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);

    return response.data.data;
  },

  async register(payload: RegisterPayload) {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );

    return response.data.data;
  },

  async refresh() {
    const response = await apiClient.post<AuthResponse>("/auth/refresh");

    return response.data.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get<CurrentUserResponse>("/auth/me");

    return response.data.data.user;
  },

  async logout() {
    const response = await apiClient.post<LogoutResponse>("/auth/logout");

    return response.data;
  },
};
