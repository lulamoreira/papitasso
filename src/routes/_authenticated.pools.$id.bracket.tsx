import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getMatchesForPool, getBracketPrediction, upsertBracketPrediction, getTeams } from "@/lib/api.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Save, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/pools/$id/bracket")({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["poolMatches", params.id], queryFn: () => getMatchesForPool({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["bracketPrediction", params.id], queryFn: () => getBracketPrediction({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
    ]);
  },
  component: BracketComponent,
});

function BracketComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/bracket" } as any);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: prediction } = useSuspenseQuery({ queryKey: ["bracketPrediction", id], queryFn: () => getBracketPrediction({ data: id } as any) });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });

  const [bracket, setBracket] = useState<any>(prediction?.bracket_json || {
    r16: [],
    qf: [],
    sf: [],
    final: { match_id: matches?.find((m: any) => m.phase === 'final')?.id || null, winner_team_id: null, home_score: 0, away_score: 0 }
  });

  const knockoutMatches = matches?.filter((m: any) => m.phase !== 'Group Stage') || [];
  const isLocked = knockoutMatches.length > 0 && new Date() > new Date(knockoutMatches[0].kickoff_at);

  const mutation = useMutation({
    mutationFn: (vars: any) => upsertBracketPrediction({ data: vars } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bracketPrediction", id] });
      toast.success("Chaveamento salvo com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar chaveamento.");
    }
  });

  const handleSave = () => {
    mutation.mutate({ poolId: id, bracketJson: bracket });
  };

  const handlePickWinner = (phase: string, index: number, teamId: string) => {
    if (isLocked) return;
    const newBracket = { ...bracket };
    if (!newBracket[phase]) newBracket[phase] = [];
    newBracket[phase][index] = teamId;
    setBracket(newBracket);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Bracket Challenge" 
        backTo="/pools/$id" 
        backToParams={{ id }}
        rightElement={
          <Button 
            size="sm"
            disabled={isLocked || mutation.isPending} 
            onClick={handleSave}
            className="gap-2 font-black h-9"
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isLocked ? 'BLOQUEADO' : 'SALVAR CHAVE'}
          </Button>
        }
      />
      <main className="container mx-auto p-4 space-y-6 pb-24 overflow-x-auto">



      <div className="flex gap-8 min-w-[1000px] pb-8">
        {/* Round of 16 (Simplified for 2026 example) */}
        <div className="flex-1 space-y-8">
          <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Oitavas</h3>
          {[...Array(8)].map((_, i) => (
            <div key={`r16-${i}`} className="space-y-1">
              <div 
                className={`p-2 border rounded text-xs font-bold cursor-pointer transition-all ${bracket.r16?.[i*2] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('qf', i, bracket.r16?.[i*2])}
              >
                {bracket.r16?.[i*2] ? teams?.find((t: any) => t.id === bracket.r16[i*2])?.name : 'Time A'}
              </div>
              <div 
                className={`p-2 border rounded text-xs font-bold cursor-pointer transition-all ${bracket.r16?.[i*2+1] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('qf', i, bracket.r16?.[i*2+1])}
              >
                {bracket.r16?.[i*2+1] ? teams?.find((t: any) => t.id === bracket.r16[i*2+1])?.name : 'Time B'}
              </div>
            </div>
          ))}
        </div>

        {/* Quarter Finals */}
        <div className="flex-1 space-y-20 pt-10">
          <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Quartas</h3>
          {[...Array(4)].map((_, i) => (
            <div key={`qf-${i}`} className="space-y-1">
              <div 
                className={`p-3 border rounded font-black text-sm cursor-pointer transition-all ${bracket.qf?.[i] === bracket.sf?.[Math.floor(i/2)] && bracket.qf?.[i] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('sf', Math.floor(i/2), bracket.qf?.[i])}
              >
                {bracket.qf?.[i] ? teams?.find((t: any) => t.id === bracket.qf[i])?.name : 'Vencedor QF'}
              </div>
            </div>
          ))}
        </div>

        {/* Semi Finals */}
        <div className="flex-1 space-y-40 pt-20">
          <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Semis</h3>
          {[...Array(2)].map((_, i) => (
            <div key={`sf-${i}`} className="space-y-1">
              <div 
                className={`p-4 border rounded font-black text-lg cursor-pointer transition-all ${bracket.sf?.[i] === bracket.final?.winner_team_id ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => setBracket({...bracket, final: {...bracket.final, winner_team_id: bracket.sf?.[i]}})}
              >
                {bracket.sf?.[i] ? teams?.find((t: any) => t.id === bracket.sf[i])?.name : 'Vencedor SF'}
              </div>
            </div>
          ))}
        </div>

        {/* Final */}
        <div className="flex-1 pt-40">
           <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-primary mb-4">🏆 CAMPEÃO</h3>
           <Card className="border-4 border-primary bg-primary/5">
             <CardContent className="p-6 text-center space-y-4">
                <div className="text-2xl font-black text-primary">
                  {bracket.final?.winner_team_id ? teams?.find((t: any) => t.id === bracket.final.winner_team_id)?.name : 'ESCOLHA O CAMPEÃO'}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Casa</label>
                    <input 
                      type="number" 
                      className="w-full bg-background border rounded p-2 text-center font-black"
                      value={bracket.final?.home_score || 0}
                      disabled={isLocked}
                      onChange={(e) => setBracket({...bracket, final: {...bracket.final, home_score: parseInt(e.target.value) || 0}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Fora</label>
                    <input 
                      type="number" 
                      className="w-full bg-background border rounded p-2 text-center font-black"
                      value={bracket.final?.away_score || 0}
                      disabled={isLocked}
                      onChange={(e) => setBracket({...bracket, final: {...bracket.final, away_score: parseInt(e.target.value) || 0}})}
                    />
                  </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
