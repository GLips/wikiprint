import { type FieldValues, type Path, type PathValue, type UseFormReturn } from "react-hook-form";

export const register = <T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>) => {
  return {
    ...form.register(name),
    error: getFormError(form, name),
  };
};

const getFormError = <T extends FieldValues>(form: UseFormReturn<T>, error: Path<T>): string | undefined => {
  return form.formState.errors[error]?.message?.toString();
};

export const registerSelect = <T extends FieldValues>(form: UseFormReturn<T>, name: Path<T>) => {
  return {
    ...form.register(name),
    error: getFormError(form, name),
    defaultValue: form.getValues(name) as string,
    onChange: (value: string | null) => {
      if (!value) return;
      form.setValue(name, value as PathValue<T, Path<T>>);
    },
  };
};

const handleServerError = (error: any, form: UseFormReturn<any>) => {
  if (typeof error === "object" && typeof error?.message === "string") {
    setServerError(form, error.message);
  } else if (typeof error === "string") {
    setServerError(form, error);
  } else {
    setServerError(form, "An unknown error ocurred.");
  }
};

const setServerError = (form: UseFormReturn<any>, error: string): void => {
  form.setError("root.serverError", { message: error });
};

const hasServerError = (form: UseFormReturn<any>): boolean => !!form.formState.errors.root?.serverError;

const getServerError = (form: UseFormReturn<any>): string | undefined =>
  form.formState.errors.root?.serverError?.message?.toString();

export const formErrorHandler = (form: UseFormReturn<any>) => ({
  has: () => hasServerError(form),
  set: (error: string) => setServerError(form, error),
  get: () => getServerError(form),
  handle: (error: any) => handleServerError(error, form),
});
