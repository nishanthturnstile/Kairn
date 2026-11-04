import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "../features/accounts/account";
export const Route = createFileRoute("/sign-in")({
  component: () => <AccountPage mode="sign-in" />,
});
