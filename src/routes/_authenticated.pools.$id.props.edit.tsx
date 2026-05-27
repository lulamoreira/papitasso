import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProps, createCustomProp, getPoolById, resolveProp } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Plus, Save, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/pools/$id/props/edit" as any)({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["props"], queryFn: () => getProps() }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
    ]);
  },
  component: PropsEditComponent,
});

function PropsEditComponent() {
  const { id } = useParams({ strict: false }) as any;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: props } = useSuspenseQuery({ queryKey: ["props"], queryFn: () => getProps() });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });

  const [isAdding, setIsAdding] = useState(false);
  const [newProp, setNewProp] = useState({
    question: "",
    type: "choice",
    points: 20,
    options: ""
  });

  const [isResolving, setIsResolving] = useState<any>(null);
  const [resolvedValue, setResolvedValue] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: any) => createCustomProp({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["props"] });
      toast.success("Prop customizado criado!");
      setIsAdding(false);
      setNewProp({ question: "", type: "choice", points: 20, options: "" });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (data: any) => resolveProp({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["props"] });
      toast.success("Prop resolvido e pontos atribuídos!");
      setIsResolving(null);
      setResolvedValue("");
    }
  });

  const handleCreate = () => {
    if (!newProp.question) return toast.error("Pergunta é obrigatória");
    
    createMutation.mutate({
      question: newProp.question,
      type: newProp.type,
      points: newProp.points,
      options_jsonb: newProp.type === 'choice' ? newProp.options.split(',').map(o => o.trim()) : null,
      code: `custom_${Date.now()}`
    });
  };

  const handleResolve = () => {
    if (!resolvedValue) return toast.error("Valor resolvido é obrigatório");
    resolveMutation.mutate({
      propId: isResolving.id,
      resolvedValue
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}/props` })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Gerenciar Props</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Configurações do Bolão
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <h2 className="font-black text-xl">Props Ativos</h2>
          <Button size="sm" className="gap-2" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" /> Novo Prop
          </Button>
        </div>

        <div className="space-y-3">
          {props?.map((prop: any) => (
            <Card key={prop.id} className={prop.resolved_at ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px] uppercase">{prop.type}</Badge>
                    <Badge variant="secondary" className="text-[9px] uppercase">{prop.points} pts</Badge>
                  </div>
                  <h3 className="font-bold text-sm">{prop.question}</h3>
                  {prop.resolved_value && (
                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Resolvido: {prop.resolved_value}
                    </p>
                  )}
                </div>
                {!prop.resolved_at && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsResolving(prop)}>
                    Resolver
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Prop Customizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pergunta</Label>
              <Input 
                placeholder="Ex: Quem vai ser o primeiro expulso?" 
                value={newProp.question}
                onChange={e => setNewProp({...newProp, question: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Resposta</Label>
                <Select value={newProp.type} onValueChange={v => setNewProp({...newProp, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Jogador</SelectItem>
                    <SelectItem value="team">Seleção</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Sim/Não</SelectItem>
                    <SelectItem value="choice">Múltipla Escolha</SelectItem>
                    <SelectItem value="exact_score">Placar Exato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pontos</Label>
                <Input 
                  type="number" 
                  value={newProp.points}
                  onChange={e => setNewProp({...newProp, points: parseInt(e.target.value)})}
                />
              </div>
            </div>
            {newProp.type === 'choice' && (
              <div className="space-y-2">
                <Label>Opções (separadas por vírgula)</Label>
                <Input 
                  placeholder="Opção 1, Opção 2, Opção 3" 
                  value={newProp.options}
                  onChange={e => setNewProp({...newProp, options: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
              Criar Prop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!isResolving} onOpenChange={() => setIsResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Prop</DialogTitle>
            <DialogDescription>
              Atenção: Isso vai atribuir pontos para todos os jogadores do bolão imediatamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <h3 className="font-black text-lg">{isResolving?.question}</h3>
            <div className="space-y-2 text-left">
              <Label>Resultado Oficial</Label>
              <Input 
                placeholder="Digite o resultado (Ex: Messi, Brasil, 3, true...)" 
                value={resolvedValue}
                onChange={e => setResolvedValue(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Dica: O valor deve ser idêntico ao que o usuário escolheu (Ex: ID do time ou nome exato).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-12 gap-2" variant="default" onClick={handleResolve} disabled={resolveMutation.isPending}>
              <AlertTriangle className="h-4 w-4" /> Confirmar e Pontuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
