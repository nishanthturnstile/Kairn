import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/accounts/account";
export const Route = createFileRoute("/account")({
  component: () => <AccountPage mode="account" />,
});
