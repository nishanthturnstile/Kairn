import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/accounts/account";
export const Route = createFileRoute("/recover")({
  component: () => <AccountPage mode="recover" />,
});
