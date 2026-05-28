import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/pools/$id/props")({
  component: () => <Outlet />,
});
