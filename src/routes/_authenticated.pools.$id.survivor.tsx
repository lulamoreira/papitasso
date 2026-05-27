import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getSurvivorRounds, getSurvivorPredictions, upsertSurvivorPrediction, getTeams } from "@/lib/api.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skull, Trophy, CheckCircle2, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/pools/$id/survivor" as any)({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["survivorRounds", params.id], queryFn: () => getSurvivorRounds({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["survivorPredictions", params.id], queryFn: () => getSurvivorPredictions({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
    ]);
  },
  component: SurvivorComponent,
});

function SurvivorComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/survivor" } as any);
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: rounds } = useSuspenseQuery({ queryKey: ["survivorRounds", id], queryFn: () => getSurvivorRounds({ data: id } as any) });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["survivorPredictions", id], queryFn: () => getSurvivorPredictions({ data: id } as any) });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });

  const mutation = useMutation({
    mutationFn: (vars: any) => upsertSurvivorPrediction({ data: vars } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survivorPredictions", id] });
      toast.success("Escolha confirmada! Boa sorte.");
      setSelectedTeam(null);
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Você já usou esta seleção neste bolão!");
      } else {
        toast.error("Erro ao salvar escolha.");
      }
    }
  });

  const lastEliminatedRound = predictions?.find((p: any) => p.result === 'eliminated')?.round_number;
  const isAlive = !lastEliminatedRound;
  const usedTeamIds = predictions?.map((p: any) => p.team_id) || [];

  const currentRound = rounds?.find((r: any) => new Date() >= new Date(r.starts_at) && new Date() <= new Date(r.ends_at)) || rounds?.[0];

  const handleConfirm = (roundNumber: number) => {
    if (!selectedTeam) return;
    mutation.mutate({ poolId: id, roundNumber, teamId: selectedTeam.id });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Survivor Mode</h1>
          <p className="text-muted-foreground text-sm">Sobreviva o máximo que puder.</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-black text-sm flex items-center gap-2 ${isAlive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
          {isAlive ? <Trophy className="h-4 w-4" /> : <Skull className="h-4 w-4" />}
          {isAlive ? 'VIVO' : `ELIMINADO NA RD ${lastEliminatedRound}`}
        </div>
      </header>

      {!isAlive && (
        <Alert variant="destructive">
          <Skull className="h-4 w-4" />
          <AlertTitle>Fim de jogo!</AlertTitle>
          <AlertDescription>
            Você foi eliminado na rodada {lastEliminatedRound}. Continue acompanhando o ranking dos sobreviventes!
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <h2 className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Rodadas</h2>
        
        {rounds?.map((round: any) => {
          const prediction = predictions?.find((p: any) => p.round_number === round.round_number);
          const isCurrent = currentRound?.id === round.id;
          const isLocked = new Date() > new Date(round.starts_at);

          return (
            <Card key={round.id} className={`overflow-hidden border-2 ${isCurrent ? 'border-primary shadow-lg shadow-primary/10' : 'border-primary/5'}`}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rodada {round.round_number}</span>
                    <h3 className="font-bold">{format(new Date(round.starts_at), "dd/MM")} - {format(new Date(round.ends_at), "dd/MM")}</h3>
                  </div>
                  {prediction ? (
                    <div className="flex items-center gap-2">
                      <img src={prediction.team?.flag_url} className="h-5 w-8 object-cover rounded shadow-sm" alt="" />
                      <span className="text-sm font-bold">{prediction.team?.name}</span>
                      {prediction.result === 'survived' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {prediction.result === 'eliminated' && <Skull className="h-4 w-4 text-red-500" />}
                    </div>
                  ) : (
                    isAlive && !isLocked && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="font-bold">Escolher Time</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Escolha sua seleção para a Rodada {round.round_number}</DialogTitle>
                            <DialogDescription>
                              Você não poderá escolher esta seleção novamente neste bolão. Se ela não vencer seu jogo na rodada, você será eliminado.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-4 gap-2 py-4 max-h-[40vh] overflow-y-auto pr-2">
                            {teams?.map((team: any) => {
                              const isUsed = usedTeamIds.includes(team.id);
                              return (
                                <Button
                                  key={team.id}
                                  variant={selectedTeam?.id === team.id ? 'default' : 'outline'}
                                  className={`h-auto flex-col p-2 gap-1 ${isUsed ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                                  disabled={isUsed}
                                  onClick={() => setSelectedTeam(team)}
                                >
                                  <img src={team.flag_url} className="h-5 w-8 object-cover rounded shadow-xs" alt="" />
                                  <span className="text-[8px] font-bold truncate w-full">{team.name}</span>
                                </Button>
                              );
                            })}
                          </div>

                          <DialogFooter>
                            <Button 
                              className="w-full font-black" 
                              disabled={!selectedTeam || mutation.isPending}
                              onClick={() => handleConfirm(round.round_number)}
                            >
                              Confirmar Escolha
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )
                  )}
                </div>
                {!prediction && isLocked && isAlive && (
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center py-1 bg-red-50 rounded">
                    ⚠️ VOCÊ NÃO FEZ SUA ESCOLHA E PODERÁ SER ELIMINADO
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}