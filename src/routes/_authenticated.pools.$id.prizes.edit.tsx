import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getPrizes, upsertPrize, deletePrize } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Plus, Trash2, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/_authenticated/pools/$id/prizes/edit")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["prizes", params.id], queryFn: () => getPrizes({ data: params.id } as any) }),
    ]);
  },
  component: EditPrizesComponent,
});

function SortablePrizeItem({ prize, onEdit, onDelete }: { prize: any, onEdit: (p: any) => void, onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: prize.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      {prize.photo_url ? (
        <img src={prize.photo_url} className="h-12 w-12 rounded object-cover" alt="" />
      ) : (
        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
          <ImageIcon className="h-5 w-5 text-muted-foreground opacity-30" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{prize.title}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
          {prize.rank ? `${prize.rank}º Lugar` : prize.category.replace('_', ' ')}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(prize)}>Editar</Button>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(prize.id)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function EditPrizesComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/prizes/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: prizes } = useSuspenseQuery({ queryKey: ["prizes", id], queryFn: () => getPrizes({ data: id } as any) });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const upsertMutation = useMutation({
    mutationFn: (data: any) => upsertPrize({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes", id] });
      setIsDialogOpen(false);
      setEditingPrize(null);
      toast.success("Prêmio salvo!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (prizeId: string) => deletePrize({ data: prizeId } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prizes", id] });
      toast.success("Prêmio removido");
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = prizes.findIndex((p: any) => p.id === active.id);
      const newIndex = prizes.findIndex((p: any) => p.id === over.id);
      const newPrizes = arrayMove(prizes, oldIndex, newIndex);
      
      // Update position_order for all moved items
      newPrizes.forEach((p: any, idx: number) => {
        upsertMutation.mutate({ ...p, position_order: idx });
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('prize-photos')
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('prize-photos')
      .getPublicUrl(filePath);

    setEditingPrize({ ...editingPrize, photo_url: publicUrl });
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...editingPrize,
      pool_id: id,
      estimated_value_cents: Math.round(parseFloat(editingPrize.value_display || "0") * 100),
    };
    delete data.value_display;
    upsertMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate({ to: "/pools/$id", params: { id } })}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao Bolão
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Gerenciar Prêmios</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black">{pool.name}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" onClick={() => setEditingPrize({ category: 'ranking', rank: (prizes?.length || 0) + 1, title: '', value_display: '0' })}>
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPrize?.id ? 'Editar Prêmio' : 'Novo Prêmio'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Tipo de Premiação</Label>
                  <RadioGroup 
                    value={editingPrize?.category === 'ranking' ? 'ranking' : 'special'} 
                    onValueChange={(val) => setEditingPrize({ ...editingPrize, category: val === 'ranking' ? 'ranking' : 'custom' })}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ranking" id="ranking" />
                      <Label htmlFor="ranking">Por Posição</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="special" id="special" />
                      <Label htmlFor="special">Especial</Label>
                    </div>
                  </RadioGroup>
                </div>

                {editingPrize?.category === 'ranking' ? (
                  <div className="space-y-2">
                    <Label>Posição (Ex: 1 para 1º lugar)</Label>
                    <Input 
                      type="number" 
                      value={editingPrize?.rank || ''} 
                      onChange={(e) => setEditingPrize({ ...editingPrize, rank: parseInt(e.target.value) })} 
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Categoria Especial</Label>
                    <Select 
                      value={editingPrize?.category} 
                      onValueChange={(val) => setEditingPrize({ ...editingPrize, category: val, rank: null })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="most_exact">Mais Placares Exatos</SelectItem>
                        <SelectItem value="most_brazil_correct">Mais Acertos Jogos do Brasil</SelectItem>
                        <SelectItem value="wooden_spoon">Lanterna (Último Lugar)</SelectItem>
                        <SelectItem value="raffle">Sorteio (Entre ativos)</SelectItem>
                        <SelectItem value="custom">Regra Customizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Título do Prêmio</Label>
                  <Input 
                    placeholder="Ex: Camisa Oficial da Seleção" 
                    value={editingPrize?.title} 
                    onChange={(e) => setEditingPrize({ ...editingPrize, title: e.target.value })} 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Detalhes sobre o prêmio..." 
                    value={editingPrize?.description} 
                    onChange={(e) => setEditingPrize({ ...editingPrize, description: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Estimado (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={editingPrize?.value_display} 
                      onChange={(e) => setEditingPrize({ ...editingPrize, value_display: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Patrocinador (Opcional)</Label>
                    <Input 
                      placeholder="Ex: Bar do Zé" 
                      value={editingPrize?.sponsor} 
                      onChange={(e) => setEditingPrize({ ...editingPrize, sponsor: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Foto do Prêmio</Label>
                  <div className="flex items-center gap-4">
                    {editingPrize?.photo_url && (
                      <img src={editingPrize.photo_url} className="h-16 w-16 rounded object-cover border" alt="" />
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Entrega</Label>
                  <Input 
                    placeholder="Ex: Retirar no local, Envio por correio..." 
                    value={editingPrize?.delivery_method} 
                    onChange={(e) => setEditingPrize({ ...editingPrize, delivery_method: e.target.value })} 
                  />
                </div>

                <Button type="submit" className="w-full" disabled={upsertMutation.isPending || uploading}>
                  {upsertMutation.isPending ? "Salvando..." : "Salvar Prêmio"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={prizes?.map((p: any) => p.id) || []} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {prizes?.map((prize: any) => (
                <SortablePrizeItem 
                  key={prize.id} 
                  prize={prize} 
                  onEdit={(p) => {
                    setEditingPrize({ ...p, value_display: (p.estimated_value_cents / 100).toString() });
                    setIsDialogOpen(true);
                  }}
                  onDelete={(pid) => {
                    if (confirm("Remover este prêmio?")) deleteMutation.mutate(pid);
                  }}
                />
              ))}
              {prizes?.length === 0 && (
                <div className="py-12 text-center text-muted-foreground italic">
                  Nenhum prêmio cadastrado.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}