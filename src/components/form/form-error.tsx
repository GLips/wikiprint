import { Alert } from "@/components/ui/alert";

export default function FormError({ error }: { error?: string }) {
  return <>{error ? <Alert variant="destructive">{error}</Alert> : null}</>;
}
