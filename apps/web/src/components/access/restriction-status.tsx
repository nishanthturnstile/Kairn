import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { RestrictionResult } from "@kairn/contracts";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function RestrictionStatus({ result }: { result: RestrictionResult }) {
  const pending = result.status === "restricted_pending_confirmation";
  const Icon = pending ? ShieldCheck : CheckCircle2;
  return (
    <Alert role="status" data-restriction={pending ? "pending" : "confirmed"}>
      <Icon aria-hidden="true" />
      <AlertTitle>
        {pending ? "Access restricted. Recovery confirmation pending." : "Restriction complete."}
      </AlertTitle>
      <AlertDescription>
        <p>
          {pending
            ? "Access is already denied. Independent recovery confirmation is still pending. Leaving this page does not restore access."
            : "Access is denied and independent recovery confirmation is recorded."}
        </p>
        <p>File and personal-data cleanup has its own status.</p>
      </AlertDescription>
    </Alert>
  );
}
