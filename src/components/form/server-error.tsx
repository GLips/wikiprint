import { Alert } from "@/components/ui/alert";
import { type UseFormReturn } from "react-hook-form";

import { formErrorHandler } from "./helpers";
import FormError from "./form-error";

export default function ServerError({ form }: { form: UseFormReturn<any> }) {
  const error = formErrorHandler(form).get();
  return <FormError error={error} />;
}
