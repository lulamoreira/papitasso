import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getMatchesForPool, getBracketPrediction, upsertBracketPrediction, getTeams } from "@/lib/api.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Save } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/pools/$id/bracket" as any)({
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
  const queryClient = useQueryClient();

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: matches } = useSuspenseQuery({ queryKey: ["poolMatches", id], queryFn: () => getMatchesForPool({ data: id } as any) });
  const { data: prediction } = useSuspenseQuery({ queryKey: ["bracketPrediction", id], queryFn: () => getBracketPrediction({ data: id } as any) });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });

  const [bracket, setBracket] = useState<any>(prediction?.bracket_json || {
    round_of_32: [],
    round_of_16: [],
    quarter_finals: [],
    semi_finals: [],
    final: { winner_team_id: null, score: "" }
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
    <div className="container mx-auto p-4 space-y-6 pb-24 overflow-x-auto">
      <header className="mb-6 flex items-center justify-between min-w-[600px]">
        <div>
          <h1 className="text-2xl font-black">Bracket Challenge</h1>
          <p className="text-muted-foreground text-sm">Monte sua chave do mata-mata até a final.</p>
        </div>
        <Button 
          disabled={isLocked || mutation.isPending} 
          onClick={handleSave}
          className="gap-2 font-black"
        >
          {isLocked ? <Lock className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isLocked ? 'BLOQUEADO' : 'SALVAR CHAVE'}
        </Button>
      </header>

      <div className="flex gap-8 min-w-[1000px] pb-8">
        {/* Round of 16 (Simplified for 2026 example) */}
        <div className="flex-1 space-y-8">
          <h3 className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Oitavas</h3>
          {[...Array(8)].map((_, i) => (
            <div key={`r16-${i}`} className="space-y-1">
              <div 
                className={`p-2 border rounded text-xs font-bold cursor-pointer transition-all ${bracket.round_of_16[i*2] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('quarter_finals', i, bracket.round_of_16[i*2])}
              >
                {bracket.round_of_16[i*2] ? teams.find((t: any) => t.id === bracket.round_of_16[i*2])?.name : 'Time A'}
              </div>
              <div 
                className={`p-2 border rounded text-xs font-bold cursor-pointer transition-all ${bracket.round_of_16[i*2+1] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('quarter_finals', i, bracket.round_of_16[i*2+1])}
              >
                {bracket.round_of_16[i*2+1] ? teams.find((t: any) => t.id === bracket.round_of_16[i*2+1])?.name : 'Time B'}
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
                className={`p-3 border rounded font-black text-sm cursor-pointer transition-all ${bracket.quarter_finals[i] === bracket.semi_finals[Math.floor(i/2)] && bracket.quarter_finals[i] ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => handlePickWinner('semi_finals', Math.floor(i/2), bracket.quarter_finals[i])}
              >
                {bracket.quarter_finals[i] ? teams.find((t: any) => t.id === bracket.quarter_finals[i])?.name : 'Vencedor QF'}
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
                className={`p-4 border rounded font-black text-lg cursor-pointer transition-all ${bracket.semi_finals[i] === bracket.final.winner_team_id ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary'}`}
                onClick={() => setBracket({...bracket, final: {...bracket.final, winner_team_id: bracket.semi_finals[i]}})}
              >
                {bracket.semi_finals[i] ? teams.find((t: any) => t.id === bracket.semi_finals[i])?.name : 'Vencedor SF'}
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
                  {bracket.final.winner_team_id ? teams.find((t: any) => t.id === bracket.final.winner_team_id)?.name : 'ESCOLHA O CAMPEÃO'}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Placar Esperado (Final)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 2-1" 
                    className="w-full bg-background border rounded p-2 text-center font-black"
                    value={bracket.final.score}
                    disabled={isLocked}
                    onChange={(e) => setBracket({...bracket, final: {...bracket.final, score: e.target.value}})}
                  />
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}