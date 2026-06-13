import { create } from "zustand";
import { accessTokenManager } from "@/features/auth/lib/access-token";
import { authService } from "@/features/auth/services/auth.service";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/features/auth/types/auth.types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  initialize: async () => {
    set({
      status: "loading",
      error: null,
    });

    try {
      const session = await authService.refresh();

      accessTokenManager.set(session.accessToken);

      set({
        user: session.user,
        status: "authenticated",
      });
    } catch {
      accessTokenManager.clear();

      set({
        user: null,
        status: "unauthenticated",
      });
    }
  },

  login: async (payload) => {
    set({
      status: "loading",
      error: null,
    });

    try {
      const session = await authService.login(payload);

      accessTokenManager.set(session.accessToken);

      set({
        user: session.user,
        status: "authenticated",
      });
    } catch (error) {
      accessTokenManager.clear();

      set({
        user: null,
        status: "unauthenticated",
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  register: async (payload) => {
    set({
      status: "loading",
      error: null,
    });

    try {
      const session = await authService.register(payload);

      accessTokenManager.set(session.accessToken);

      set({
        user: session.user,
        status: "authenticated",
      });
    } catch (error) {
      accessTokenManager.clear();

      set({
        user: null,
        status: "unauthenticated",
        error: getErrorMessage(error),
      });

      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      accessTokenManager.clear();

      set({
        user: null,
        status: "unauthenticated",
        error: null,
      });
    }
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
