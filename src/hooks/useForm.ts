import { useState, useCallback } from 'react';

export function useForm<T>(initialState: T) {
  const [form, setForm] = useState(initialState);

  const handleChange = useCallback((key: keyof T, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => setForm(initialState), [initialState]);

  return {
    form,
    handleChange,
    resetForm,
    setForm,
  };
}
