import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getPoolById, getLeaderboard, getMatchesForPool, getPredictions, getProfile, 
  getPrizes, getPrizeWinners, getProps, getPredictionsProps, getPoolMembers,
  deletePool, transferOwnership, leavePool 
} from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChevronLeft, Share2, Settings, Trophy, Users, Calendar, ArrowUpRight, 
  ArrowDownRight, Minus, PencilLine, User as UserIcon, Gift, Award, 
  HelpCircle, Target, LogOut, UserPlus, Trash2, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/pools/$id/")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["leaderboard", params.id], queryFn: () => getLeaderboard({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() }),
      context.queryClient.ensureQueryData({ queryKey: ["prizes", params.id], queryFn: () => getPrizes({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["winners", params.id], queryFn: () => getPrizeWinners({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["props"], queryFn: () => getProps() }),
      context.queryClient.ensureQueryData({ queryKey: ["predictionsProps", params.id], queryFn: () => getPredictionsProps({ data: params.id } as any) }),
    ]);
  },
  component: PoolDetailComponent,
});


function PoolDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: leaderboard } = useSuspenseQuery({ queryKey: ["leaderboard", id], queryFn: () => getLeaderboard({ data: id } as any) });
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictions", id], queryFn: () => getPredictions({ data: id } as any) });
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: prizes } = useSuspenseQuery({ queryKey: ["prizes", id], queryFn: () => getPrizes({ data: id } as any) });
  const { data: winners } = useSuspenseQuery({ queryKey: ["winners", id], queryFn: () => getPrizeWinners({ data: id } as any) });
  const { data: allProps } = useSuspenseQuery({ queryKey: ["props"], queryFn: () => getProps() });
  const { data: predictionsProps } = useSuspenseQuery({ queryKey: ["predictionsProps", id], queryFn: () => getPredictionsProps({ data: id } as any) });

  const isOwner = pool?.owner_id === profile?.id;
  const hasWinners = winners && winners.length > 0;

  const myEntry = leaderboard?.find((entry: any) => entry.user_id === profile?.id);
  const totalMatches = matches?.length || 0;
  const predictedMatches = predictions?.length || 0;
  
  const totalProps = allProps?.length || 0;
  const predictedProps = predictionsProps?.length || 0;
  const propCompletionPercent = totalProps > 0 ? Math.round((predictedProps / totalProps) * 100) : 0;

  if (!pool) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <Trophy className="h-10 w-10 opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Bolão não encontrado</h2>
          <p className="text-muted-foreground">Você não tem permissão para ver este bolão ou ele não existe.</p>
        </div>
        <Button onClick={() => navigate({ to: "/pools" })}>Ver Meus Bolões</Button>
      </div>
    );
  }

  useEffect(() => {
    const channel = supabase
      .channel(`pool-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions_exact', filter: `pool_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
        queryClient.invalidateQueries({ queryKey: ["predictions", id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions_pickem', filter: `pool_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions_bracket', filter: `pool_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions_props', filter: `pool_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ["poolMatches", id] });
        queryClient.invalidateQueries({ queryKey: ["leaderboard", id] });
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
          onClick={() => navigate({ to: "/pools/$id/predict", params: { id } })}
        >
          <PencilLine className="h-5 w-5" />
          Dar Meus Palpites
        </Button>

        <Tabs defaultValue="matches" className="w-full" onValueChange={(val) => {
          const externalRoutes = ['pickem', 'survivor', 'bracket', 'props', 'fantasy', 'chat', 'mural'];
          if (externalRoutes.includes(val)) {
            const target = `/pools/${id}/${val}`;
            navigate({ to: target as any });
          }
        }}>
          <TabsList className={`w-full grid overflow-x-auto ${hasWinners ? 'grid-cols-11' : 'grid-cols-10'} min-w-max`}>
            <TabsTrigger value="matches" className="gap-1 px-3"><Calendar className="h-3 w-3" /> <span className="hidden sm:inline">Jogos</span></TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 px-3"><Users className="h-3 w-3" /> <span className="hidden sm:inline">Chat</span></TabsTrigger>
            <TabsTrigger value="mural" className="gap-1 px-3"><Trophy className="h-3 w-3" /> <span className="hidden sm:inline">Mural</span></TabsTrigger>
            {pool.modes_enabled?.includes('fantasy') && pool.type === 'advanced' && <TabsTrigger value="fantasy" className="gap-1 px-3"><Target className="h-3 w-3 text-primary" /> <span className="hidden sm:inline">Fantasy</span></TabsTrigger>}
            {pool.modes_enabled?.includes('pickem') && <TabsTrigger value="pickem" className="gap-1 px-3"><Trophy className="h-3 w-3" /> <span className="hidden sm:inline">Pick'em</span></TabsTrigger>}
            {pool.modes_enabled?.includes('survivor') && <TabsTrigger value="survivor" className="gap-1 px-3"><Award className="h-3 w-3" /> <span className="hidden sm:inline">Survivor</span></TabsTrigger>}
            {pool.modes_enabled?.includes('bracket') && <TabsTrigger value="bracket" className="gap-1 px-3"><Settings className="h-3 w-3" /> <span className="hidden sm:inline">Chaveamento</span></TabsTrigger>}
            {pool.modes_enabled?.includes('props') && (
              <TabsTrigger value="props" className="gap-1 px-3 relative">
                <HelpCircle className="h-3 w-3" /> 
                <span className="hidden sm:inline">Props ({predictedProps}/{totalProps})</span>
                <span className="sm:hidden">{propCompletionPercent}%</span>
                {propCompletionPercent < 100 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="ranking" className="gap-1 px-3"><Trophy className="h-3 w-3" /> <span className="hidden sm:inline">Ranking</span></TabsTrigger>
            <TabsTrigger value="prizes" className="gap-1 px-3"><Gift className="h-3 w-3" /> <span className="hidden sm:inline">Prêmios</span></TabsTrigger>
            {hasWinners && <TabsTrigger value="winners" className="gap-1 px-3"><Award className="h-3 w-3" /> <span className="hidden sm:inline">Ganhadores</span></TabsTrigger>}
            <TabsTrigger value="members" className="gap-1 px-3"><Users className="h-3 w-3" /> <span className="hidden sm:inline">Membros</span></TabsTrigger>
          </TabsList>

          
          <TabsContent value="matches" className="py-4 space-y-4">
            {matches.map((match: any) => {
              const pred = predictions?.find((p: any) => p.match_id === match.id);
              const isFinished = match.status === 'finished';
              const isLocked = new Date(match.kickoff_at) <= new Date();
              return (
                <Card 
                  key={match.id} 
                  className={`overflow-hidden transition-all ${isLocked ? 'opacity-70' : 'cursor-pointer hover:border-primary border-2 border-transparent'}`}
                  onClick={() => !isLocked && navigate({ 
                    to: "/pools/$id/predict/$matchId", 
                    params: { id, matchId: match.id } 
                  })}
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{format(new Date(match.kickoff_at), "dd/MM - HH:mm", { locale: ptBR })}</span>
                      <span>{match.phase}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      {!match.home_team || !match.away_team ? (
                        <div className="flex-1 text-center py-4">
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
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <img src={match.home_team?.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                            <span className="text-[10px] font-bold truncate w-full text-center">{match.home_team?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isFinished ? (
                              <>
                                <span className="text-xl font-black">{match.home_score ?? 0}</span>
                                <span className="text-muted-foreground opacity-30">x</span>
                                <span className="text-xl font-black">{match.away_score ?? 0}</span>
                              </>
                            ) : (
                              <span className="text-sm font-black text-primary/40 italic tracking-tighter">VS</span>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <img src={match.away_team?.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                            <span className="text-[10px] font-bold truncate w-full text-center">{match.away_team?.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {!pred && !isFinished && !isLocked && (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-primary animate-pulse">
                        <PencilLine className="h-3 w-3" /> Toque para palpitar
                      </div>
                    )}
                    {pred && (
                      <div className="bg-muted/50 rounded-lg p-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Seu palpite:</span>
                        <span className="font-black text-sm">{pred.home_score} x {pred.away_score}</span>
                        {pred.points_awarded !== null && (
                          <span className="text-primary font-black text-[10px]">+{pred.points_awarded} pts</span>
                        )}
                      </div>
                    )}
                    {match.venue && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/40 p-2">
                        {match.venue.image_url && (
                          <img src={match.venue.image_url} alt={match.venue.name}
                            className="h-10 w-14 rounded object-cover" loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                        <div className="text-[10px] leading-tight">
                          <div className="font-semibold">{match.venue.name}</div>
                          <div className="text-muted-foreground">
                            {match.venue.city}{match.venue.state ? `, ${match.venue.state}` : ''} · {match.venue.country}
                          </div>
                        </div>
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
                <tbody className="relative">
                  <LayoutGroup>
                    {leaderboard.map((entry: any) => (
                      <motion.tr 
                        layoutId={entry.user_id}
                        key={entry.user_id} 
                        initial={false}
                        className={`border-b last:border-0 transition-colors ${entry.user_id === profile?.id ? 'bg-primary/5' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black tabular-nums">{entry.position}º</span>
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
                        <td className="p-3 text-right font-black text-primary tabular-nums">
                          {entry.points}
                        </td>
                      </motion.tr>
                    ))}
                  </LayoutGroup>
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="prizes" className="py-4 space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-700">🏆 Total em jogo</div>
              <div className="text-2xl font-black text-yellow-600">
                R$ {(prizes?.reduce((acc: number, p: any) => acc + (p.estimated_value_cents || 0), 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {prizes?.map((prize: any) => (
                <Card key={prize.id} className="overflow-hidden border-2 border-primary/5">
                  <div className="aspect-video relative bg-muted">
                    {prize.photo_url ? (
                      <img src={prize.photo_url} className="w-full h-full object-cover" alt={prize.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="h-12 w-12 text-muted-foreground opacity-20" />
                      </div>
                    )}
                    {prize.rank && prize.rank <= 3 && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 h-8 w-8 rounded-full flex items-center justify-center font-black text-lg shadow-lg">
                        {prize.rank === 1 ? '🥇' : prize.rank === 2 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg leading-tight">{prize.title}</h3>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Valor Est.</div>
                        <div className="font-black text-primary">R$ {(prize.estimated_value_cents / 100).toFixed(2)}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{prize.description}</p>
                    {prize.sponsor && (
                      <div className="text-[10px] font-bold text-muted-foreground uppercase pt-2 border-t">
                        Oferecido por: <span className="text-primary">{prize.sponsor}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {isOwner && (
              <Button 
                variant="outline" 
                className="w-full h-12 border-dashed border-2 gap-2"
                onClick={() => navigate({ to: `/pools/${id}/prizes/edit` })}
              >
                <Settings className="h-4 w-4" /> Editar Prêmios
              </Button>
            )}
          </TabsContent>

          <TabsContent value="winners" className="py-4 space-y-4">
             {winners?.map((winner: any) => (
               <Card key={winner.id} className="p-4 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                   <div className="relative">
                     <Avatar className="h-12 w-12 border-2 border-yellow-400">
                       <AvatarImage src={winner.profile?.avatar_url} />
                       <AvatarFallback><UserIcon /></AvatarFallback>
                     </Avatar>
                     <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                       <Award className="h-3 w-3 text-yellow-900" />
                     </div>
                   </div>
                   <div>
                     <div className="font-bold">{winner.profile?.name}</div>
                     <div className="text-xs text-muted-foreground">{winner.prize?.title}</div>
                   </div>
                 </div>
                 <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      winner.status === 'delivered' ? 'bg-green-500/10 text-green-600' : 
                      winner.status === 'reserved' ? 'bg-blue-500/10 text-blue-600' : 
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {winner.status === 'delivered' ? 'Entregue' : winner.status === 'reserved' ? 'Reservado' : 'Pendente'}
                    </div>
                    {isOwner && winner.status !== 'delivered' && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-[10px] h-auto p-0 h-6"
                        onClick={() => navigate({ to: `/pools/${id}/winners` })}
                      >
                        Gerenciar
                      </Button>
                    )}
                 </div>
               </Card>
             ))}
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
