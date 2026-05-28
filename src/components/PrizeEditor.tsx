import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Gift, Trash2, Edit2, Plus, Package, Truck, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prize {
  id?: string;
  rank?: number;
  category?: string;
  title: string;
  description?: string;
  photo_url?: string;
  estimated_value_cents?: number;
  sponsor?: string;
  delivery_method?: string;
  position_order: number;
}

interface PrizeEditorProps {
  prizes: Prize[];
  onChange: (prizes: Prize[]) => void;
}

export function PrizeEditor({ prizes, onChange }: PrizeEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [currentPrize, setCurrentPrize] = useState<Partial<Prize>>({
    title: "",
    description: "",
    category: "1º Lugar",
    estimated_value_cents: 0,
    delivery_method: "A combinar",
    sponsor: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prize-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prize-photos')
        .getPublicUrl(filePath);

      setCurrentPrize({ ...currentPrize, photo_url: publicUrl });
      toast.success("Foto carregada!");
    } catch (error: any) {
      toast.error("Erro ao carregar foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!currentPrize.title) {
      toast.error("Título é obrigatório");
      return;
    }

    const newPrizes = [...prizes];
    if (editingIndex !== null) {
      newPrizes[editingIndex] = { ...newPrizes[editingIndex], ...currentPrize } as Prize;
    } else {
      newPrizes.push({ ...currentPrize, position_order: prizes.length } as Prize);
    }

    onChange(newPrizes);
    setIsDialogOpen(false);
    setEditingIndex(null);
    setCurrentPrize({
      title: "",
      description: "",
      category: "Próximo Lugar",
      estimated_value_cents: 0,
      delivery_method: "A combinar",
    });
  };

  const handleRemove = (index: number) => {
    const newPrizes = prizes.filter((_, i) => i !== index);
    onChange(newPrizes);
  };

  const handleEdit = (index: number) => {
    setCurrentPrize(prizes[index]);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const totalValue = prizes.reduce((acc, p) => acc + (p.estimated_value_cents || 0), 0) / 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-left">
          <p className="text-sm font-medium">{prizes.length} prêmios definidos</p>
          <p className="text-xs text-muted-foreground">Total estimado: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => {
              setEditingIndex(null);
              setCurrentPrize({
                title: "",
                description: "",
                category: `${prizes.length + 1}º Lugar`,
                estimated_value_cents: 0,
                delivery_method: "A combinar",
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar prêmio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingIndex !== null ? "Editar Prêmio" : "Novo Prêmio"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria / Posição</Label>
                  <Input 
                    placeholder="Ex: 1º Lugar" 
                    value={currentPrize.category} 
                    onChange={e => setCurrentPrize({...currentPrize, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Estimado (R$)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    onChange={e => setCurrentPrize({...currentPrize, estimated_value_cents: Math.round(parseFloat(e.target.value) * 100)})}
                    value={currentPrize.estimated_value_cents ? (currentPrize.estimated_value_cents / 100).toString() : ""}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Título do Prêmio</Label>
                <Input 
                  placeholder="Ex: Camisa Oficial da Seleção" 
                  value={currentPrize.title}
                  onChange={e => setCurrentPrize({...currentPrize, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  placeholder="Detalhes sobre o prêmio..." 
                  value={currentPrize.description}
                  onChange={e => setCurrentPrize({...currentPrize, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patrocinador (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Nike, Adidas..." 
                    value={currentPrize.sponsor}
                    onChange={e => setCurrentPrize({...currentPrize, sponsor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entrega</Label>
                  <Input 
                    placeholder="Ex: Correios, Retirada..." 
                    value={currentPrize.delivery_method}
                    onChange={e => setCurrentPrize({...currentPrize, delivery_method: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto do Prêmio</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                    {currentPrize.photo_url ? (
                      <img src={currentPrize.photo_url} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Imagens quadradas funcionam melhor.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={uploading}>
                {editingIndex !== null ? "Salvar Alterações" : "Adicionar Prêmio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {prizes.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-xl border-dashed border-2">
            <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Nenhum prêmio adicionado ainda.</p>
          </div>
        ) : (
          prizes.map((prize, idx) => (
            <Card key={idx} className="overflow-hidden bg-card/50 hover:bg-card transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border">
                  {prize.photo_url ? (
                    <img src={prize.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase">
                      {prize.category}
                    </span>
                    {prize.estimated_value_cents && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        R$ {(prize.estimated_value_cents / 100).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold truncate">{prize.title}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(idx)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleRemove(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
