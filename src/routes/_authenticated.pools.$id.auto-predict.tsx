import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getAiAutoPredictions, getPoolById, upsertPrediction } from "@/lib/api.functions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Brain, Check, ChevronLeft, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pools/$id/auto-predict")({
  component: AutoPredictPage,
});

function AutoPredictPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  
  const { data: pool } = useSuspenseQuery({
    queryKey: ["pool", id],
    queryFn: () => getPoolById({ data: id }),
  });

  const { data: suggestions, isLoading, error: aiError } = useQuery({
    queryKey: ["ai-auto-predictions", id],
    queryFn: async () => {
      try {
        const result = await getAiAutoPredictions({ data: id });
        return result;
      } catch (err: any) {
        console.error('[DEBUG] Palpita pra mim error:', err);
        toast.error(err.message || "Erro ao gerar palpites automáticos");
        throw err;
      }
    },
    retry: false
  });

  const [matches, setMatches] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  // Initialize matches when data is loaded
  useEffect(() => {
    if (suggestions?.predictions) {
      setMatches(suggestions.predictions);
    }
  }, [suggestions]);


  const saveMutation = useMutation({
    mutationFn: (match: any) => (upsertPrediction as any)({ 
      data: { 
        poolId: id, 

        matchId: match.match_id, 
        homeScore: match.predicted_home, 
        awayScore: match.predicted_away 
      } 
    }),

    onSuccess: (_, variables) => {
      setConfirmed(prev => new Set(prev).add(variables.matchId));
    }
  });

  const handleConfirmAll = async () => {
    const unconfirmed = matches.filter(m => !confirmed.has(m.match_id));
    for (const match of unconfirmed) {
      await saveMutation.mutateAsync(match);
    }
    toast.success("Todos os palpites foram salvos!");
    queryClient.invalidateQueries({ queryKey: ["predictions", id] });
  };

  const updateScore = (matchId: string, side: 'home' | 'away', val: number) => {
    setMatches(prev => prev.map(m => {
      if (m.match_id === matchId) {
        return {
          ...m,
          [side === 'home' ? 'predicted_home' : 'predicted_away']: Math.max(0, val)
        };
      }
      return m;
    }));
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ChevronLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-500 w-6 h-6" />
            Modo Preguiça (IA)
          </h1>
          <p className="text-muted-foreground text-sm">
            A IA sugeriu estes placares baseados no Ranking FIFA e contexto.
          </p>
        </div>
      </header>

      {isLoading ? (
        <Card className="animate-pulse">
          <CardContent className="p-8 text-center space-y-4">
            <Brain className="w-12 h-12 text-primary mx-auto animate-bounce" />
            <p className="text-muted-foreground">A IA está analisando as estatísticas e gerando os melhores palpites...</p>
          </CardContent>
        </Card>
      ) : aiError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-red-500" />
            </div>
            <p className="text-red-700 font-medium">Não foi possível carregar as sugestões da IA.</p>
            <p className="text-red-500 text-xs">{(aiError as any).message}</p>
            <Button variant="outline" onClick={() => window.history.back()}>Voltar</Button>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Você já palpitou em todos os jogos deste bolão ou não há jogos disponíveis.</p>
            <Button variant="outline" onClick={() => window.history.back()}>Voltar</Button>
          </CardContent>
        </Card>
      ) : (

        <div className="space-y-4">
          {matches.map((m) => (
            <Card key={m.match_id} className={confirmed.has(m.match_id) ? "opacity-60 bg-muted/30" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 text-right flex items-center justify-end gap-2">
                  <span className="font-bold text-sm hidden sm:inline">{m.home_team.name}</span>
                  <img src={m.home_team.flag_url} className="w-6 h-4 object-cover rounded-sm shadow-sm" alt={m.home_team.name} />
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={m.predicted_home} 
                    onChange={(e) => updateScore(m.match_id, 'home', parseInt(e.target.value))}
                    className="w-12 h-12 text-center text-xl font-bold border rounded bg-background"
                  />
                  <span className="text-muted-foreground">x</span>
                  <input 
                    type="number" 
                    value={m.predicted_away} 
                    onChange={(e) => updateScore(m.match_id, 'away', parseInt(e.target.value))}
                    className="w-12 h-12 text-center text-xl font-bold border rounded bg-background"
                  />
                </div>

                <div className="flex-1 text-left flex items-center gap-2">
                  <img src={m.away_team.flag_url} className="w-6 h-4 object-cover rounded-sm shadow-sm" alt={m.away_team.name} />
                  <span className="font-bold text-sm hidden sm:inline">{m.away_team.name}</span>
                  {confirmed.has(m.match_id) && <Check className="text-green-500 w-5 h-5 ml-auto" />}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t">
            <div className="container max-w-2xl mx-auto flex gap-4">
              <Button 
                className="flex-1 gap-2 text-lg py-6" 
                onClick={handleConfirmAll}
                disabled={confirmed.size === matches.length || saveMutation.isPending}
              >
                <Save className="w-5 h-5" />
                Confirmar Todos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
