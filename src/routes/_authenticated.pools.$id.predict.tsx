import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMatchesForPool, getPredictions, getPoolById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Lock, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/pools/$id/predict")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
    ]);
  },
  component: PredictListComponent,
});

function PredictListComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/predict" });
  const navigate = useNavigate();
  
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictions", id], queryFn: () => getPredictions({ data: id } as any) });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });

  const getMatchPrediction = (matchId: string) => {
    return predictions?.find((p: any) => p.match_id === matchId);
  };

  const isMatchLocked = (kickoffAt: string) => {
    return new Date(kickoffAt) <= new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}` })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Palpitar</h1>
            <p className="text-xs text-muted-foreground truncate">{pool.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4 pb-24">
        {matches.map((match: any) => {
          const prediction = getMatchPrediction(match.id);
          const locked = isMatchLocked(match.kickoff_at);
          const isFinished = match.status === 'finished';

          return (
            <Card 
              key={match.id}
              className={`overflow-hidden transition-all active:scale-[0.98] ${locked ? 'opacity-70' : 'cursor-pointer hover:border-primary'}`}
              onClick={() => navigate({ to: `/pools/${id}/predict/${match.id}` })}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(match.kickoff_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2">
                    {prediction ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 className="h-3 w-3" /> Palpitado
                      </span>
                    ) : (
                      <span className="text-amber-500">Pendente</span>
                    )}
                    {locked && <Lock className="h-3 w-3 text-red-500" />}
                  </div>
                </div>

                <div className="grid grid-cols-7 items-center gap-2">
                  <div className="col-span-3 flex flex-col items-center gap-2">
                    <img src={match.home_team.flag_url} alt={match.home_team.name} className="h-8 w-12 object-cover rounded shadow-sm" />
                    <span className="text-sm font-bold text-center line-clamp-1">{match.home_team.name}</span>
                  </div>

                  <div className="col-span-1 flex flex-col items-center justify-center">
                    {isFinished || locked ? (
                      <div className="text-lg font-black bg-muted rounded px-2 py-1">
                        {match.home_score ?? 0} x {match.away_score ?? 0}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-primary italic">VS</div>
                    )}
                  </div>

                  <div className="col-span-3 flex flex-col items-center gap-2">
                    <img src={match.away_team.flag_url} alt={match.away_team.name} className="h-8 w-12 object-cover rounded shadow-sm" />
                    <span className="text-sm font-bold text-center line-clamp-1">{match.away_team.name}</span>
                  </div>
                </div>

                {prediction && (
                  <div className="mt-4 pt-3 border-t flex items-center justify-center gap-4">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground">Seu palpite:</div>
                    <div className="text-xl font-black text-primary">
                      {prediction.home_score} - {prediction.away_score}
                    </div>
                    {prediction.points_awarded !== null && (
                      <div className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        +{prediction.points_awarded} pts
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
