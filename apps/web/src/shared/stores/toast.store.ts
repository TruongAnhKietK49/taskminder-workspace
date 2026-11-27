import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_TOAST_DURATION_MS = 2200;

type ToastState = {
  toasts: ToastItem[];
  addToast: (
    message: string,
    variant?: ToastVariant,
    durationMs?: number,
  ) => void;
  removeToast: (id: string) => void;
};

let toastSeq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (
    message,
    variant = "success",
    durationMs = DEFAULT_TOAST_DURATION_MS,
  ) => {
    const id = `toast-${Date.now()}-${++toastSeq}`;

    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, variant }],
    }));

    window.setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id),
      }));
    }, durationMs);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== id),
    }));
  },
}));

export const toast = {
  success: (message: string, durationMs = DEFAULT_TOAST_DURATION_MS) =>
    useToastStore.getState().addToast(message, "success", durationMs),
  error: (message: string, durationMs = DEFAULT_TOAST_DURATION_MS) =>
    useToastStore.getState().addToast(message, "error", durationMs),
  info: (message: string, durationMs = DEFAULT_TOAST_DURATION_MS) =>
    useToastStore.getState().addToast(message, "info", durationMs),
};
