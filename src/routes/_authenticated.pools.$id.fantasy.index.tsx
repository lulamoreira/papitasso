import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getFantasyLineup, getPoolById, getFantasyRanking } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FantasyPitch } from "@/components/fantasy/FantasyPitch";
import { Trophy, Users, TrendingUp, Clock, ChevronRight, Settings, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";


export const Route = createFileRoute("/_authenticated/pools/$id/fantasy/")({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["fantasyLineup", params.id, 1], queryFn: () => getFantasyLineup({ data: { poolId: params.id, gameweek: 1 } } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["fantasyRanking", params.id], queryFn: () => getFantasyRanking({ data: params.id } as any) }),
    ]);
  },
  component: FantasyDashboardComponent,
});

function FantasyDashboardComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  
  const { data: lineup } = useSuspenseQuery({ queryKey: ["fantasyLineup", id, 1], queryFn: () => getFantasyLineup({ data: { poolId: id, gameweek: 1 } } as any) });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: ranking } = useSuspenseQuery({ queryKey: ["fantasyRanking", id], queryFn: () => getFantasyRanking({ data: id } as any) });

  if (!lineup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-6 text-center">
        <div className="p-6 bg-primary/10 rounded-full">
          <Trophy className="h-16 w-16 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Fantasy Mode</h1>
          <p className="text-muted-foreground">Você ainda não escalou seu time para este bolão.</p>
        </div>
        <Button size="lg" className="h-14 px-8 font-black uppercase italic gap-2" onClick={() => navigate({ to: `/pools/${id}/fantasy/build` })}>
          Começar Escalada
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  const userRank = ranking.findIndex((r: any) => r.profile.id === lineup.user_id) + 1;

  const slots = lineup.players.map((lp: any) => ({
    slot: lp.slot,
    player: lp.player,
    isCaptain: lineup.captain_id === lp.player_id,
    isViceCaptain: lineup.vice_captain_id === lp.player_id
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-white p-6 pb-20 rounded-b-[3rem] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Meu Desempenho</p>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Fantasy World Cup</h1>
            </div>
          </div>
          <Link to={`/pools/${id}/fantasy/ranking`}>
            <div className="text-right">
              <p className="text-3xl font-black italic leading-none">#{userRank || '--'}</p>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Posição Global</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <p className="text-[8px] font-black uppercase opacity-60 mb-1">Total Pts</p>
            <p className="text-xl font-black">{lineup.total_points}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <p className="text-[8px] font-black uppercase opacity-60 mb-1">Gameweek</p>
            <p className="text-xl font-black">1/8</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center">
            <p className="text-[8px] font-black uppercase opacity-60 mb-1">Patrimônio</p>
            <p className="text-xl font-black">${(lineup.budget_used / 1000000).toFixed(1)}M</p>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto -mt-12 px-4 space-y-6">
        <Card className="border-none shadow-2xl overflow-hidden bg-background">
          <CardContent className="p-2">
            <FantasyPitch slots={slots} formation={lineup.formation} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-14 font-black uppercase italic gap-2 border-2" onClick={() => navigate({ to: `/pools/${id}/fantasy/build` })}>
            <Settings className="h-5 w-5" />
            Escalação
          </Button>
          <Button variant="outline" className="h-14 font-black uppercase italic gap-2 border-2" onClick={() => navigate({ to: `/pools/${id}/fantasy/transfers` })}>
            <ArrowRightLeft className="h-5 w-5" />
            Transferências
          </Button>
        </div>

        <section className="space-y-4">
          <h3 className="font-black uppercase italic text-sm tracking-tighter flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Resumo da Gameweek
          </h3>
          <div className="space-y-3">
             <Card className="bg-muted/30 border-none">
               <CardContent className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="bg-primary/10 p-2 rounded-lg">
                     <Clock className="h-4 w-4 text-primary" />
                   </div>
                   <div>
                     <p className="text-xs font-bold">Próximo Prazo</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-black">GW2 • 15 Jun 13:00</p>
                   </div>
                 </div>
                 <Badge variant="secondary" className="font-black">FECHADO</Badge>
               </CardContent>
             </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
