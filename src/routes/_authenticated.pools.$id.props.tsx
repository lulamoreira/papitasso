import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProps, getPredictionsProps, upsertPredictionProp, getPoolById, getTeams, getPlayers } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, HelpCircle, User, Users, Flag, Hash, CheckCircle2, Circle, Trophy, Settings } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pools/$id/props" as any)({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["props"], queryFn: () => getProps() }),
      context.queryClient.ensureQueryData({ queryKey: ["predictionsProps", params.id], queryFn: () => getPredictionsProps({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
      context.queryClient.ensureQueryData({ queryKey: ["players"], queryFn: () => getPlayers() }),
    ]);
  },
  component: PropsComponent,
});

function PropsComponent() {
  const { id } = useParams({ strict: false }) as any;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: props } = useSuspenseQuery({ queryKey: ["props"], queryFn: () => getProps() });
  const { data: predictions } = useSuspenseQuery({ queryKey: ["predictionsProps", id], queryFn: () => getPredictionsProps({ data: id } as any) });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });
  const { data: players } = useSuspenseQuery({ queryKey: ["players"], queryFn: () => getPlayers() });

  const [selectedProp, setSelectedProp] = useState<any>(null);
  const [answer, setAnswer] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => upsertPredictionProp({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictionsProps", id] });
      toast.success("Palpite salvo com sucesso!");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Erro ao salvar palpite.");
    }
  });

  const handleOpenProp = (prop: any) => {
    const pred = predictions?.find((p: any) => p.prop_id === prop.id);
    setSelectedProp(prop);
    setAnswer(pred?.answer || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!answer) {
      toast.error("Por favor, preencha o seu palpite.");
      return;
    }
    mutation.mutate({
      poolId: id,
      propId: selectedProp.id,
      answer
    });
  };

  const isLocked = (prop: any) => {
    // Locking happens after WC start (June 11th, 2026)
    const wcStartDate = new Date('2026-06-11T00:00:00Z');
    return new Date() > wcStartDate;
  };

  const getPropIcon = (type: string) => {
    switch (type) {
      case 'player': return <User className="h-4 w-4" />;
      case 'team': return <Flag className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'boolean': return <CheckCircle2 className="h-4 w-4" />;
      case 'choice': return <Circle className="h-4 w-4" />;
      case 'exact_score': return <Trophy className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getAnswerDisplay = (prop: any, value: string) => {
    if (!value) return "Não palpitado";
    if (prop.type === 'team') {
      const team = teams?.find((t: any) => t.id === value || t.name === value);
      return team ? team.name : value;
    }
    if (prop.type === 'player') {
      const player = players?.find((p: any) => p.id === value || p.name === value);
      return player ? player.name : value;
    }
    if (prop.type === 'boolean') {
      return value === 'true' ? 'Sim' : 'Não';
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}` })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Props do Bolão</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Palpites de Longo Prazo
            </p>
          </div>
          {pool.owner_id === queryClient.getQueryData<any>(["profile"])?.id && (
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}/props/edit` })}>
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4 pb-24">
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-bold uppercase">Progresso</div>
            <div className="text-xl font-black">{predictions?.length || 0} / {props?.length || 0}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-bold uppercase">Fechamento</div>
            <div className="text-xs font-bold text-primary">11 de Junho de 2026</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {props?.map((prop: any) => {
            const prediction = predictions?.find((p: any) => p.prop_id === prop.id);
            const locked = isLocked(prop);
            
            return (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !locked && handleOpenProp(prop)}
              >
                <Card className={cn(
                  "cursor-pointer transition-all hover:border-primary/50",
                  prediction ? "border-primary/20 bg-primary/[0.02]" : "",
                  locked ? "opacity-75 grayscale-[0.5]" : ""
                )}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      prediction ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {getPropIcon(prop.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight">{prop.question}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {prediction ? (
                          <p className="text-xs font-medium text-primary">
                            Palpite: <span className="font-bold">{getAnswerDisplay(prop, prediction.answer)}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Clique para palpitar</p>
                        )}
                        {prop.points && (
                          <Badge variant="outline" className="text-[9px] h-4 uppercase">{prop.points} pts</Badge>
                        )}
                      </div>
                    </div>
                    {locked ? (
                      <Badge variant="secondary" className="text-[9px] uppercase">Fechado</Badge>
                    ) : (
                      prediction ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedProp?.question}</DialogTitle>
            <DialogDescription>
              Este palpite vale {selectedProp?.points} pontos e será resolvido no fim da Copa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedProp?.type === 'boolean' && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant={answer === 'true' ? 'default' : 'outline'} 
                  className="h-20 text-lg font-bold flex flex-col gap-1"
                  onClick={() => setAnswer('true')}
                >
                  SIM
                  <CheckCircle2 className="h-5 w-5" />
                </Button>
                <Button 
                  variant={answer === 'false' ? 'default' : 'outline'} 
                  className="h-20 text-lg font-bold flex flex-col gap-1"
                  onClick={() => setAnswer('false')}
                >
                  NÃO
                  <Circle className="h-5 w-5" />
                </Button>
              </div>
            )}

            {selectedProp?.type === 'choice' && (
              <RadioGroup value={answer} onValueChange={setAnswer} className="space-y-3">
                {selectedProp.options_jsonb?.map((option: string) => (
                  <div key={option} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer font-bold">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {selectedProp?.type === 'team' && (
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-1">
                {teams?.map((team: any) => (
                  <button
                    key={team.id}
                    onClick={() => setAnswer(team.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      answer === team.id ? "bg-primary border-primary text-primary-foreground shadow-lg" : "hover:bg-muted border-transparent"
                    )}
                  >
                    <img src={team.flag_url} className="h-6 w-9 object-cover rounded shadow-sm" alt="" />
                    <span className="text-[8px] font-bold text-center line-clamp-1">{team.name}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedProp?.type === 'player' && (
              <div className="space-y-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-12"
                    >
                      {answer ? players?.find((p: any) => p.id === answer)?.name : "Selecione um jogador..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar jogador..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
                        <CommandGroup>
                          {players?.map((player: any) => (
                            <CommandItem
                              key={player.id}
                              value={player.name}
                              onSelect={() => {
                                setAnswer(player.id);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  answer === player.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <img src={player.team?.flag_url} className="h-4 w-6 object-cover rounded" alt="" />
                              <span className="font-bold">{player.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{player.team?.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {selectedProp?.type === 'number' && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="text-6xl font-black text-primary">{answer || 0}</div>
                <div className="flex gap-4 w-full">
                  <Button variant="outline" size="lg" className="flex-1 text-2xl" onClick={() => setAnswer((Math.max(0, parseInt(answer || "0") - 1)).toString())}>-</Button>
                  <Button variant="outline" size="lg" className="flex-1 text-2xl" onClick={() => setAnswer((parseInt(answer || "0") + 1).toString())}>+</Button>
                </div>
              </div>
            )}

            {selectedProp?.type === 'exact_score' && (
              <div className="flex items-center justify-center gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <Input 
                    type="number" 
                    className="h-20 w-20 text-center text-4xl font-black" 
                    value={answer.split('x')[0] || "0"} 
                    onChange={(e) => setAnswer(`${e.target.value}x${answer.split('x')[1] || "0"}`)}
                  />
                </div>
                <span className="text-4xl font-black opacity-20">X</span>
                <div className="flex flex-col items-center gap-2">
                  <Input 
                    type="number" 
                    className="h-20 w-20 text-center text-4xl font-black" 
                    value={answer.split('x')[1] || "0"} 
                    onChange={(e) => setAnswer(`${answer.split('x')[0] || "0"}x${e.target.value}`)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button className="w-full h-12 font-black" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Confirmar Palpite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
