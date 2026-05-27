import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getLeaderboard, getMatchesForPool, getPredictions, getProfile, getPrizes, getPrizeWinners } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Share2, Settings, Trophy, Users, Calendar, ArrowUpRight, ArrowDownRight, Minus, PencilLine, User as UserIcon, Gift, Award } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/pools/$id")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["leaderboard", params.id], queryFn: () => getLeaderboard({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() }),
      context.queryClient.ensureQueryData({ queryKey: ["prizes", params.id], queryFn: () => getPrizes({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["winners", params.id], queryFn: () => getPrizeWinners({ data: params.id } as any) }),
    ]);
  },
  component: PoolDetailComponent,
});

function PoolDetailComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: leaderboard } = useSuspenseQuery({ queryKey: ["leaderboard", id], queryFn: () => getLeaderboard({ data: id } as any) });
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictions", id], queryFn: () => getPredictions({ data: id } as any) });
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: prizes } = useSuspenseQuery({ queryKey: ["prizes", id], queryFn: () => getPrizes({ data: id } as any) });
  const { data: winners } = useSuspenseQuery({ queryKey: ["winners", id], queryFn: () => getPrizeWinners({ data: id } as any) });

  const isOwner = pool?.owner_id === profile?.id;
  const hasWinners = winners && winners.length > 0;

  const myEntry = leaderboard?.find((entry: any) => entry.user_id === profile?.id);
  const totalMatches = matches?.length || 0;
  const predictedMatches = predictions?.length || 0;

  useEffect(() => {
    const channel = supabase
      .channel(`pool-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions_exact', filter: `pool_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
        queryClient.invalidateQueries({ queryKey: ["predictions", id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ["poolMatches", id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/join/${pool.invite_code}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link do convite copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/pools" })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold truncate">{pool.name}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {pool.type === 'advanced' ? '🔥 Bolão Avançado' : '🟢 Bolão Simples'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 pb-24">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Posição</div>
            <div className="text-2xl font-black text-primary">{myEntry?.position || "--"}º</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Pontos</div>
            <div className="text-2xl font-black text-primary">{myEntry?.points || 0}</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Jogos</div>
            <div className="text-2xl font-black text-primary">{predictedMatches}/{totalMatches}</div>
          </div>
        </div>

        <Button 
          className="w-full h-14 text-lg font-black gap-2 shadow-xl shadow-primary/20"
          onClick={() => navigate({ to: `/pools/${id}/predict` })}
        >
          <PencilLine className="h-5 w-5" />
          Dar Meus Palpites
        </Button>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="matches" className="gap-2"><Calendar className="h-4 w-4" /> Jogos</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2"><Trophy className="h-4 w-4" /> Ranking</TabsTrigger>
            <TabsTrigger value="members" className="gap-2"><Users className="h-4 w-4" /> Membros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="py-4 space-y-4">
            {matches.map((match: any) => {
              const pred = predictions?.find((p: any) => p.match_id === match.id);
              const isFinished = match.status === 'finished';
              return (
                <Card key={match.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{format(new Date(match.kickoff_at), "dd/MM - HH:mm", { locale: ptBR })}</span>
                      <span>{match.phase}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <img src={match.home_team.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                        <span className="text-[10px] font-bold truncate w-full text-center">{match.home_team.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black">{match.home_score ?? 0}</span>
                        <span className="text-muted-foreground opacity-30">x</span>
                        <span className="text-xl font-black">{match.away_score ?? 0}</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <img src={match.away_team.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                        <span className="text-[10px] font-bold truncate w-full text-center">{match.away_team.name}</span>
                      </div>
                    </div>
                    {pred && (
                      <div className="bg-muted/50 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Seu palpite:</span>
                        <span className="font-black text-sm">{pred.home_score} x {pred.away_score}</span>
                        {pred.points_awarded !== null && (
                          <span className="text-primary font-black text-[10px]">+{pred.points_awarded} pts</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          
          <TabsContent value="ranking" className="py-4 space-y-4">
            {myEntry && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-black text-primary">{myEntry.position}º</div>
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">Seu Desempenho</div>
                    <div className="text-xs text-muted-foreground">Você está indo bem!</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary">{myEntry.points}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Pontos</div>
                </div>
              </div>
            )}

            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Pos</th>
                    <th className="p-3 text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Jogador</th>
                    <th className="p-3 text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry: any) => (
                    <tr key={entry.user_id} className={`border-b last:border-0 ${entry.user_id === profile?.id ? 'bg-primary/5' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black">{entry.position}º</span>
                          {/* Mock variation for now */}
                          {entry.position === 1 ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <Minus className="h-3 w-3 text-muted-foreground opacity-30" />}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={entry.profile?.avatar_url} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                          </Avatar>
                          <span className="font-bold truncate max-w-[120px]">{entry.profile?.name || "Jogador"}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-primary">
                        {entry.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="py-20 text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Em breve: Gerencie os participantes.</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
