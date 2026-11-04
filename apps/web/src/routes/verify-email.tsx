import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/accounts/account";
export const Route = createFileRoute("/verify-email")({
  component: () => <AccountPage mode="verify-email" />,
});
