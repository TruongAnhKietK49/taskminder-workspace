import axios from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.",
) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage;
  }

  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallbackMessage;
}
