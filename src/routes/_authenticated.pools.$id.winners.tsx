import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPoolById, getPrizeWinners, updateWinnerStatus } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, CheckCircle2, Image as ImageIcon, Loader2, User as UserIcon, Award } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/_authenticated/pools/$id/winners")({
  loader: async ({ params, context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["winners", params.id], queryFn: () => getPrizeWinners({ data: params.id } as any) }),
    ]);
  },
  component: WinnersManagementComponent,
});

function WinnersManagementComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/winners" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deliveryData, setDeliveryData] = useState({ proof_url: '', notes: '' });

  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const { data: winners } = useSuspenseQuery({ queryKey: ["winners", id], queryFn: () => getPrizeWinners({ data: id } as any) });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateWinnerStatus({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["winners", id] });
      setIsDialogOpen(false);
      if (deliveryData.proof_url) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      toast.success("Status atualizado!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedWinner.id}-${Date.now()}.${fileExt}`;
    const filePath = `proofs/${id}/${fileName}`;

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

    setDeliveryData({ ...deliveryData, proof_url: publicUrl });
    setUploading(false);
  };

  const handleMarkDelivered = () => {
    updateMutation.mutate({
      winnerId: selectedWinner.id,
      status: 'delivered',
      delivery_proof_url: deliveryData.proof_url,
      notes: deliveryData.notes
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: `/pools/${id}` })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Entrega de Prêmios</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black">{pool.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4">
        {winners?.map((winner: any) => (
          <Card key={winner.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-yellow-400">
                      <AvatarImage src={winner.profile?.avatar_url} />
                      <AvatarFallback><UserIcon /></AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                      <Award className="h-3 w-3 text-yellow-900" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{winner.profile?.name}</div>
                    <div className="text-xs text-muted-foreground">{winner.prize?.title}</div>
                  </div>
                </div>
                {winner.status === 'delivered' ? (
                  <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Entregue
                  </div>
                ) : (
                  <Dialog open={isDialogOpen && selectedWinner?.id === winner.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (open) {
                      setSelectedWinner(winner);
                      setDeliveryData({ proof_url: '', notes: '' });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">Entregar</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Entrega</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={winner.profile?.avatar_url} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm">{winner.profile?.name}</div>
                            <div className="text-xs text-muted-foreground">{winner.prize?.title}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Comprovante de Entrega (Foto/Print)</Label>
                          <div className="flex items-center gap-4">
                            {deliveryData.proof_url && (
                              <img src={deliveryData.proof_url} className="h-20 w-20 rounded object-cover border" alt="" />
                            )}
                            <label className="flex-1 cursor-pointer">
                              <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Observações/Notas</Label>
                          <Textarea 
                            placeholder="Ex: Entregue pessoalmente no dia do jogo..." 
                            value={deliveryData.notes}
                            onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                          />
                        </div>

                        <Button className="w-full" onClick={handleMarkDelivered} disabled={updateMutation.isPending || uploading}>
                          {updateMutation.isPending ? "Processando..." : "Marcar como Entregue"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {winner.status === 'delivered' && winner.delivery_proof_url && (
                <div className="px-4 pb-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Comprovante:</div>
                  <img src={winner.delivery_proof_url} className="w-full h-32 object-cover rounded-lg border" alt="Comprovante" />
                  {winner.notes && <p className="mt-2 text-xs text-muted-foreground italic">"{winner.notes}"</p>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {winners?.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic">
            Nenhum ganhador definido ainda.
          </div>
        )}
      </main>
    </div>
  );
}