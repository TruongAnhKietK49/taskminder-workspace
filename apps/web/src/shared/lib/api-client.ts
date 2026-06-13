import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { accessTokenManager } from "@/features/auth/lib/access-token";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = accessTokenManager.get();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const response = await axios.post<{
    data: {
      accessToken: string;
    };
  }>(`${apiBaseUrl}/auth/refresh`, undefined, {
    withCredentials: true,
  });

  const accessToken = response.data.data.accessToken;

  accessTokenManager.set(accessToken);

  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const accessToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      accessTokenManager.clear();

      return Promise.reject(refreshError);
    }
  },
);
