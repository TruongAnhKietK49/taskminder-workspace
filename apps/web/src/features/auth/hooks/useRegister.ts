import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTE_PATHS } from "@/app/routes/route-paths";
import { useAuthStore } from "@/features/auth/stores/auth.store";

type RegisterFormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: RegisterFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateRegisterForm(form: RegisterFormState): string | null {
  const fullName = form.fullName.trim();
  const email = form.email.trim();

  if (fullName.length < 2) {
    return "Họ tên phải có ít nhất 2 ký tự.";
  }

  if (!email) {
    return "Vui lòng nhập email.";
  }

  if (!email.includes("@")) {
    return "Email không hợp lệ.";
  }

  if (form.password.length < 8) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (form.password.length > 72) {
    return "Mật khẩu không được vượt quá 72 ký tự.";
  }

  if (form.password !== form.confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }

  return null;
}

export function useRegister() {
  const navigate = useNavigate();

  const register = useAuthStore((state) => state.register);
  const status = useAuthStore((state) => state.status);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState<RegisterFormState>(initialFormState);

  const [validationError, setValidationError] = useState<string | null>(null);

  const isSubmitting = status === "loading";
  const error = validationError ?? authError;

  useEffect(() => {
    clearError();

    return () => {
      clearError();
    };
  }, [clearError]);

  function updateField(field: keyof RegisterFormState, value: string) {
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
    const validationMessage = validateRegisterForm(form);

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate(ROUTE_PATHS.DASHBOARD, {
        replace: true,
      });
    } catch {
      // Store xử lý lỗi API.
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
