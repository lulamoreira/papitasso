import { PageHeader } from "@/components/PageHeader";
import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPoolById } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated/pools/$id/")({
  loader: async ({ params, context }: any) => {
    await context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) });
  },
  component: PoolLayoutComponent,
});

function PoolLayoutComponent() {
  return <Outlet />;
}

