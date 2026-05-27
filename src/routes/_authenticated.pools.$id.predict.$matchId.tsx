import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMatchesForPool, getPredictions, upsertPrediction, getAiCommentary, getAiPredictionAnalysis } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Minus, Plus, Save, Clock, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { PoolChat } from "@/components/PoolChat";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pools/$id/predict/$matchId")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
    ]);
  },
  component: PredictionDetailComponent,
});

function PredictionDetailComponent() {
  const { id, matchId } = useParams({ from: "/_authenticated/pools/$id/predict/$matchId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictions", id], queryFn: () => getPredictions({ data: id } as any) });

  const match = matches.find((m: any) => m.id === matchId);
  const prediction = predictions?.find((p: any) => p.match_id === matchId);

  const [homeScore, setHomeScore] = useState(prediction?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.away_score ?? 0);
  const [timeLeft, setTimeLeft] = useState("");

  const isLocked = new Date(match.kickoff_at) <= new Date();

  useEffect(() => {
    const timer = setInterval(() => {
      if (isLocked) {
        setTimeLeft("Encerrado");
      } else {
        setTimeLeft(formatDistanceToNow(new Date(match.kickoff_at), { locale: ptBR, addSuffix: true }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [match.kickoff_at, isLocked]);

  const upsertMutation = useMutation({
    mutationFn: () => upsertPrediction({ 
      data: { poolId: id, matchId, homeScore, awayScore } 
    } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions", id] });
      toast.success("Palpite salvo!");
      
      // Navigate to next pending match
      const currentIndex = matches.findIndex((m: any) => m.id === matchId);
      const nextPending = matches.slice(currentIndex + 1).find((m: any) => {
        const hasPred = predictions?.some((p: any) => p.match_id === m.id);
        const locked = new Date(m.kickoff_at) <= new Date();
        return !hasPred && !locked;
      });

      if (nextPending) {
        navigate({ to: `/pools/${id}/predict/${nextPending.id}` });
      } else {
        navigate({ to: `/pools/${id}/predict` });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar palpite");
    }
  });

  if (!match) return <div>Jogo não encontrado</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}/predict` })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Seu Palpite</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
              Copa do Mundo 2026 • {match.phase}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
            <Clock className="h-4 w-4" />
            {isLocked ? "Palpites encerrados" : `Fecha ${timeLeft}`}
          </div>
          {isLocked && (
            <div className="flex items-center justify-center gap-2 text-destructive font-black uppercase text-xs">
              <Lock className="h-3 w-3" /> Jogo Iniciado
            </div>
          )}
        </div>

        <div className="w-full max-w-sm grid grid-cols-2 gap-8 items-center">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-4">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={match.home_team.flag_url} 
              alt={match.home_team.name} 
              className="h-20 w-32 object-cover rounded-xl shadow-2xl border-4 border-background"
            />
            <h3 className="text-lg font-black text-center line-clamp-2">{match.home_team.name}</h3>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-2"
                onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                disabled={isLocked || homeScore === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-5xl font-black tabular-nums">{homeScore}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-2"
                onClick={() => setHomeScore(homeScore + 1)}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-4">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              src={match.away_team.flag_url} 
              alt={match.away_team.name} 
              className="h-20 w-32 object-cover rounded-xl shadow-2xl border-4 border-background"
            />
            <h3 className="text-lg font-black text-center line-clamp-2">{match.away_team.name}</h3>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-2"
                onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                disabled={isLocked || awayScore === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-5xl font-black tabular-nums">{awayScore}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 border-2"
                onClick={() => setAwayScore(awayScore + 1)}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm pt-8">
          <Button 
            className="w-full h-14 text-lg font-black gap-2 shadow-xl shadow-primary/20"
            disabled={isLocked || upsertMutation.isPending}
            onClick={() => upsertMutation.mutate()}
          >
            {isLocked ? "Palpites Encerrados" : (upsertMutation.isPending ? "Salvando..." : "Salvar Palpite")}
            {!isLocked && <Save className="h-5 w-5" />}
          </Button>
        </div>

        {/* Live Chat Drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="secondary" className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-2xl gap-2 z-50">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Chat da Partida ⚽</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden px-4 pb-4">
              <PoolChat poolId={id} matchId={matchId} className="h-full border-none shadow-none" />
            </div>
          </DrawerContent>
        </Drawer>
      </main>

      <footer className="p-4 border-t bg-muted/30">
        <div className="container mx-auto flex justify-between gap-4">
          <Button variant="ghost" className="flex-1 gap-2" onClick={() => {
            const idx = matches.findIndex((m: any) => m.id === matchId);
            if (idx > 0) navigate({ to: `/pools/${id}/predict/${matches[idx-1].id}` });
          }}>
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button variant="ghost" className="flex-1 gap-2" onClick={() => {
            const idx = matches.findIndex((m: any) => m.id === matchId);
            if (idx < matches.length - 1) navigate({ to: `/pools/${id}/predict/${matches[idx+1].id}` });
          }}>
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
