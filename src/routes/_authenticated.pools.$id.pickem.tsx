import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getMatchesForPool, getPickemPredictions, upsertPickemPrediction } from "@/lib/api.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pools/$id/pickem")({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pickemPredictions", params.id], queryFn: () => getPickemPredictions({ data: params.id } as any) }),
    ]);
  },
  component: PickemComponent,
});

function PickemComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/pickem" } as any);
  const queryClient = useQueryClient();

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["pickemPredictions", id], queryFn: () => getPickemPredictions({ data: id } as any) });

  const mutation = useMutation({
    mutationFn: (vars: any) => upsertPickemPrediction({ data: vars } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pickemPredictions", id] });
      toast.success("Palpite salvo!");
    },
    onError: () => {
      toast.error("Erro ao salvar palpite.");
    }
  });

  const handlePick = (matchId: string, winner: 'home' | 'draw' | 'away') => {
    mutation.mutate({ poolId: id, matchId, winner });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-black">Pick'em Challenge</h1>
        <p className="text-muted-foreground text-sm">Escolha quem vence cada jogo. Acertos valem 3 pontos.</p>
      </header>

      <div className="space-y-4">
        {matches.map((match: any) => {
          const pred = predictions?.find((p: any) => p.match_id === match.id);
          const isLocked = new Date() > new Date(match.kickoff_at);

          return (
            <Card key={match.id} className="overflow-hidden border-2 border-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>{format(new Date(match.kickoff_at), "dd/MM - HH:mm", { locale: ptBR })}</span>
                  <span className={isLocked ? 'text-red-500' : 'text-amber-500'}>{isLocked ? '🔒 BLOQUEADO' : '⚽ ABERTO'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={pred?.winner === 'home' ? 'default' : 'outline'}
                    className={`h-auto flex-col py-3 gap-2 transition-all ${pred?.winner === 'home' ? 'scale-105 bg-primary shadow-lg ring-2 ring-primary ring-offset-2' : ''}`}
                    disabled={isLocked || mutation.isPending}
                    onClick={() => handlePick(match.id, 'home')}
                  >
                    <img src={match.home_team.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                    <span className="text-[10px] font-black truncate w-full text-center">{match.home_team.name}</span>
                  </Button>

                  <Button
                    variant={pred?.winner === 'draw' ? 'default' : 'outline'}
                    className={`h-auto flex-col py-3 gap-2 transition-all ${pred?.winner === 'draw' ? 'scale-105 bg-primary shadow-lg ring-2 ring-primary ring-offset-2' : ''}`}
                    disabled={isLocked || mutation.isPending}
                    onClick={() => handlePick(match.id, 'draw')}
                  >
                    <div className="h-6 flex items-center justify-center font-black">X</div>
                    <span className="text-[10px] font-black uppercase">Empate</span>
                  </Button>

                  <Button
                    variant={pred?.winner === 'away' ? 'default' : 'outline'}
                    className={`h-auto flex-col py-3 gap-2 transition-all ${pred?.winner === 'away' ? 'scale-105 bg-primary shadow-lg ring-2 ring-primary ring-offset-2' : ''}`}
                    disabled={isLocked || mutation.isPending}
                    onClick={() => handlePick(match.id, 'away')}
                  >
                    <img src={match.away_team.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                    <span className="text-[10px] font-black truncate w-full text-center">{match.away_team.name}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}