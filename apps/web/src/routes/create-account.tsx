import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/accounts/account";
export const Route = createFileRoute("/create-account")({
  component: () => <AccountPage mode="create-account" />,
});
