import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMatchesForPool, getPredictions, upsertPrediction, getAiCommentary, getAiPredictionAnalysis } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Minus, Plus, Save, Clock, Lock, Mic2, Brain, Sparkles, TrendingUp, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { PoolChat } from "@/components/PoolChat";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pools/$id/predict/$matchId" as any)({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["predictions", params.id], queryFn: () => getPredictions({ data: params.id } as any) }),
    ]);
  },

  component: PredictionDetailComponent,
});

function PredictionDetailComponent() {
  const { id, matchId } = useParams({ from: "/_authenticated/pools/$id/predict/$matchId" as any });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictions", id], queryFn: () => getPredictions({ data: id } as any) });

  const match = matches.find((m: any) => m.id === matchId);
  const prediction = predictions?.find((p: any) => p.match_id === matchId);

  const [homeScore, setHomeScore] = useState(prediction?.home_score ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.away_score ?? 0);
  const [timeLeft, setTimeLeft] = useState("");
  const [commentaryStyle, setCommentaryStyle] = useState<'galvao' | 'casimiro' | 'narrator'>('galvao');
  const [commentary, setCommentary] = useState<string | null>(null);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

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
    mutationFn: () => (upsertPrediction as any)({ 
      data: { poolId: id, matchId, homeScore, awayScore } 
    }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["predictions", id] });
      toast.success("Palpite salvo!");
      
      // Fetch AI Analysis
      try {
        const res = await (getAiPredictionAnalysis as any)({ 
          data: { poolId: id, matchId, homeScore, awayScore } 
        });
        setAnalysis(res);
        setShowAnalysis(true);
      } catch (e) {
        handleNavigateNext();
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar palpite");
    }
  });

  const handleNavigateNext = () => {
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
  };

  const fetchCommentary = async () => {
    setIsCommentaryLoading(true);
    try {
      const res = await (getAiCommentary as any)({ 
        data: { matchId, mode: isLocked ? 'post' : 'pre', style: commentaryStyle } 
      });
      setCommentary(res.text);
    } catch (err) {
      toast.error("Erro ao gerar comentário");
    } finally {
      setIsCommentaryLoading(false);
    }
  };

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
          <p className="text-xs text-muted-foreground font-bold">{match.stadium}</p>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{timeLeft}</span>
          </div>

          <Drawer>
            <DrawerTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 gap-2 rounded-full border-primary/20 hover:border-primary hover:bg-primary/5"
                onClick={fetchCommentary}
              >
                <Mic2 className="w-4 h-4 text-primary" />
                🎙️ Comentário IA
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5 text-primary" />
                    Narrador Virtual
                  </DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-6">
                  <div className="flex justify-center gap-2">
                    {(['galvao', 'casimiro', 'narrator'] as const).map((style) => (
                      <Button
                        key={style}
                        variant={commentaryStyle === style ? 'default' : 'outline'}
                        size="sm"
                        className="text-[10px] h-7 px-3 rounded-full"
                        onClick={() => {
                          setCommentaryStyle(style);
                          setCommentary(null);
                        }}
                      >
                        {style === 'galvao' ? 'Galvão' : style === 'casimiro' ? 'Casimiro' : 'Neutro'}
                      </Button>
                    ))}
                  </div>

                  {isCommentaryLoading ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      <p className="text-sm text-muted-foreground animate-pulse">Sintonizando com a IA...</p>
                    </div>
                  ) : commentary ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="bg-muted p-4 rounded-xl relative"
                    >
                      <span className="absolute -top-3 left-4 bg-primary text-[8px] font-bold text-white px-2 py-0.5 rounded italic">
                        {commentaryStyle.toUpperCase()}
                      </span>
                      <p className="text-sm leading-relaxed italic">"{commentary}"</p>
                    </motion.div>
                  ) : (
                    <Button className="w-full" onClick={fetchCommentary}>Gerar Comentário</Button>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <div className="w-full max-w-sm flex items-center justify-between gap-6">
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="h-20 w-28 bg-muted rounded-lg overflow-hidden shadow-md">
              <img src={match.home_team.flag_url} alt={match.home_team.name} className="h-full w-full object-cover" />
            </div>
            <span className="text-center font-black text-sm uppercase tracking-tighter">{match.home_team.name}</span>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setHomeScore((s: number) => Math.max(0, s - 1))}
                disabled={isLocked}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-5xl font-black tabular-nums">{homeScore}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setHomeScore((s: number) => s + 1)}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-3xl font-black text-muted-foreground/30">VS</div>

          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="h-20 w-28 bg-muted rounded-lg overflow-hidden shadow-md">
              <img src={match.away_team.flag_url} alt={match.away_team.name} className="h-full w-full object-cover" />
            </div>
            <span className="text-center font-black text-sm uppercase tracking-tighter">{match.away_team.name}</span>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setAwayScore(s => Math.max(0, s - 1))}
                disabled={isLocked}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-5xl font-black tabular-nums">{awayScore}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full"
                onClick={() => setAwayScore(s => s + 1)}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm pt-8">
          <Button 
            className="w-full h-14 text-lg font-bold gap-2 shadow-xl shadow-primary/20"
            disabled={isLocked || upsertMutation.isPending}
            onClick={() => upsertMutation.mutate()}
          >
            {upsertMutation.isPending ? "Salvando..." : (
              <>
                <Save className="h-5 w-5" />
                Salvar Palpite
              </>
            )}
          </Button>
        </div>
      </main>

      <div className="border-t bg-muted/30 p-4">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Chat do Jogo
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh]">
             <div className="container max-w-2xl mx-auto h-full overflow-hidden flex flex-col">
               <DrawerHeader>
                 <DrawerTitle>Resenha: {match.home_team.name} x {match.away_team.name}</DrawerTitle>
               </DrawerHeader>
               <div className="flex-1 overflow-hidden">
                 <PoolChat poolId={id} matchId={matchId} />
               </div>
             </div>
          </DrawerContent>
        </Drawer>
      </div>

      <AnimatePresence>
        {showAnalysis && analysis && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <Card className="w-full max-w-sm border-2 border-primary shadow-2xl">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    analysis.risk_level === 'safe' ? 'bg-green-100 text-green-600' :
                    analysis.risk_level === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Análise da IA</h3>
                    <p className="text-xs text-muted-foreground uppercase font-black">Nível de Risco: {analysis.risk_level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Popularidade</p>
                    <p className="text-xl font-black">{Math.round(analysis.popularity_pct)}%</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Consenso</p>
                    <p className="text-xl font-black">{analysis.group_consensus}</p>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl flex gap-3 italic">
                  <Sparkles className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm leading-relaxed">"{analysis.comment}"</p>
                </div>

                <Button className="w-full" onClick={handleNavigateNext}>
                  Continuar
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
