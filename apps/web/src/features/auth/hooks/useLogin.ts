import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import type { LoginPayload } from "@/features/auth/types/auth.types";

type LocationState = {
  from?: string;
};

type LoginFormState = LoginPayload;

const initialFormState: LoginFormState = {
  email: "",
  password: "",
};

function validateLoginForm(form: LoginFormState): string | null {
  const email = form.email.trim();

  if (!email) {
    return "Vui lòng nhập email.";
  }

  if (!email.includes("@")) {
    return "Email không hợp lệ.";
  }

  if (!form.password) {
    return "Vui lòng nhập mật khẩu.";
  }

  if (form.password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  return null;
}

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState<LoginFormState>(initialFormState);

  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmitting = status === "loading";
  const error = validationError ?? authError;

  useEffect(() => {
    clearError();

    return () => {
      clearError();
    };
  }, [clearError]);

  function updateField(field: keyof LoginFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setValidationError(null);

    if (authError) {
      clearError();
    }
  }

  async function submit() {
    const validationMessage = validateLoginForm(form);

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      const locationState = location.state as LocationState | null;

      navigate(locationState?.from ?? ROUTE_PATHS.DASHBOARD, {
        replace: true,
      });
    } catch {
      // Store chịu trách nhiệm chuẩn hóa lỗi API.
    }
  }

  return {
    form,
    error,
    isSubmitting,
    updateField,
    submit,
  };
}
