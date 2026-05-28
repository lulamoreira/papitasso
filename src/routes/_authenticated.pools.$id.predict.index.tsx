import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getMatchesForPool, getPredictions, getPoolById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Lock, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";


export const Route = createFileRoute("/_authenticated/pools/$id/predict/")({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
    ]);
  },
  component: PredictListComponent,
});

function PredictListComponent() {
  const { id } = Route.useParams();
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate({ to: "/pools/$id", params: { id } })}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao Bolão
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Palpitar</h1>
            <p className="text-xs text-muted-foreground truncate">{pool.name}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-xs border-primary/20 hover:border-primary hover:bg-primary/5"
            onClick={() => navigate({ to: "/pools/$id/auto-predict", params: { id } })}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
            <span className="hidden sm:inline">Palpita pra mim</span>
          </Button>
        </div>

      </header>

      <main className="container mx-auto p-4 space-y-4 pb-24">
        {matches.map((match: any, index: any) => {
          const prediction = getMatchPrediction(match.id);
          const locked = isMatchLocked(match.kickoff_at);
          const isFinished = match.status === 'finished';

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: locked ? 1 : 1.01 }}
              whileTap={{ scale: locked ? 1 : 0.98 }}
            >
              <Card 
                className={`overflow-hidden transition-all relative ${locked ? 'opacity-70' : 'cursor-pointer hover:border-primary border-2 border-transparent shadow-sm'}`}
                onClick={() => !locked && match.home_team && match.away_team && navigate({ 
                  to: "/pools/$id/predict/$matchId", 
                  params: { id, matchId: match.id } 
                })}
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
                        <span className="text-amber-500 animate-pulse">Pendente</span>
                      )}
                      {locked && <Lock className="h-3 w-3 text-red-500" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-2">
                    {!match.home_team || !match.away_team ? (
                      <div className="col-span-7 text-center py-4">
                        <div className="text-sm font-black text-muted-foreground tracking-tight">
                          {match.placeholder_label || 'A definir'}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 uppercase mt-1">
                          {match.phase === 'round_of_32' ? 'Oitavas (32)' :
                           match.phase === 'round_of_16' ? 'Oitavas' :
                           match.phase === 'quarter' ? 'Quartas' :
                           match.phase === 'semi' ? 'Semifinal' :
                           match.phase === 'third' ? 'Disputa 3º lugar' :
                           match.phase === 'final' ? 'FINAL' : 'Mata-mata'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="col-span-3 flex flex-col items-center gap-2">
                          <div className="relative">
                            <img 
                              src={match.home_team?.flag_url} 
                              alt={match.home_team?.name} 
                              className="h-10 w-14 object-cover rounded shadow-sm border border-muted" 
                            />
                            <div className="absolute -inset-0.5 rounded border border-white/20 pointer-events-none" />
                          </div>
                          <span className="text-sm font-bold text-center line-clamp-1">{match.home_team?.name}</span>
                        </div>

                        <div className="col-span-1 flex flex-col items-center justify-center">
                          {isFinished || (locked && match.home_score !== null) ? (
                            <div className="text-lg font-black bg-muted/50 rounded-lg px-2.5 py-1 tabular-nums border">
                              {match.home_score ?? 0}
                              <span className="mx-1 text-muted-foreground font-medium">×</span>
                              {match.away_score ?? 0}
                            </div>
                          ) : (
                            <div className="text-xs font-black text-primary/40 italic tracking-tighter">VS</div>
                          )}
                        </div>

                        <div className="col-span-3 flex flex-col items-center gap-2">
                          <div className="relative">
                            <img 
                              src={match.away_team?.flag_url} 
                              alt={match.away_team?.name} 
                              className="h-10 w-14 object-cover rounded shadow-sm border border-muted" 
                            />
                            <div className="absolute -inset-0.5 rounded border border-white/20 pointer-events-none" />
                          </div>
                          <span className="text-sm font-bold text-center line-clamp-1">{match.away_team?.name}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {prediction && (
                    <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Seu Palpite</div>
                      <div className="flex items-center gap-3">
                        <div className="text-xl font-black text-primary tabular-nums tracking-tighter">
                          {prediction.home_score}
                          <span className="mx-1.5 text-muted-foreground/30 font-light">—</span>
                          {prediction.away_score}
                        </div>
                        {prediction.points_awarded !== null && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm"
                          >
                            +{prediction.points_awarded} PTS
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </main>
    </div>
  );
}
