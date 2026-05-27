import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolByInviteCode, joinPool } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Users, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/join/$code")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["invite", params.code], queryFn: () => getPoolByInviteCode({ data: params.code } as any) });
  },
  component: JoinPoolComponent,
});

function JoinPoolComponent() {
  const { code } = useParams({ from: "/join/$code" });
  const { data: pool } = useSuspenseQuery({ queryKey: ["invite", code], queryFn: () => getPoolByInviteCode({ data: code } as any) });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => joinPool({ data: code } as any),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["myPools"] });
      toast.success("Bem-vindo ao bolão!");
      navigate({ to: `/pools/${data.pool_id}` });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao entrar no bolão");
    }
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
            <Trophy className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Você foi convidado!</CardTitle>
            <CardDescription className="text-base">
              {pool.owner?.name} convidou você para o bolão:
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="p-6 bg-muted/50 rounded-2xl border text-center space-y-2">
            <h3 className="text-xl font-black text-primary uppercase">{pool.name}</h3>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 12 membros</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {pool.type === 'advanced' ? 'Avançado' : 'Simples'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full h-14 text-lg font-bold gap-2" 
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? "Entrando..." : "Aceitar Convite"}
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
