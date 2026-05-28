import { PageHeader } from "@/components/PageHeader";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPoolById } from "@/lib/api.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pools/$id/")({
  loader: async ({ params, context }: any) => {
    await context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) });
  },
  component: PoolIndexComponent,
});

function PoolIndexComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={pool.name} backTo="/pools" />
      <main className="container mx-auto p-4 space-y-4">
        <Card onClick={() => navigate({ to: `/pools/${id}/predict`, params: { id } })} className="p-4 cursor-pointer hover:border-primary">
          <CardContent className="p-0 font-bold">Jogos e Palpites</CardContent>
        </Card>
      </main>
    </div>
  );
}
