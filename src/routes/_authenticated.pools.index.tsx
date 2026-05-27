import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyPools, joinPool } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Trophy, ChevronRight, Hash } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/pools/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["myPools"], queryFn: () => getMyPools() });
  },
  component: PoolsListComponent,
});

function PoolsListComponent() {
  const { data: pools } = useSuspenseQuery({ queryKey: ["myPools"], queryFn: () => getMyPools() });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);

  const joinMutation = useMutation({
    mutationFn: (code: string) => joinPool({ data: code } as any),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["myPools"] });
      toast.success("Você entrou no bolão!");
      setJoinOpen(false);
      navigate({ to: `/pools/${data.pool_id}` });
    },
    onError: (err: any) => {
      toast.error(err.message || "Código inválido");
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 justify-between">
          <h1 className="text-xl font-bold">Meus Bolões</h1>
          <Button size="sm" onClick={() => navigate({ to: "/pools/new" })} className="gap-2">
            <Plus className="h-4 w-4" /> Criar
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4">
        <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-12 gap-2 border-dashed border-2">
              <Hash className="h-4 w-4" /> Entrar com código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrar em um Bolão</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código do Convite</label>
                <Input 
                  placeholder="EX: A1B2C3" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-xl tracking-widest h-12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full" 
                onClick={() => joinMutation.mutate(inviteCode)}
                disabled={!inviteCode || joinMutation.isPending}
              >
                {joinMutation.isPending ? "Entrando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {pools.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Nenhum bolão ainda</h3>
              <p className="text-muted-foreground">Crie um bolão para seus amigos ou entre com um código.</p>
            </div>
            <Button onClick={() => navigate({ to: "/pools/new" })}>Criar meu primeiro bolão</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {pools.map((pool: any) => (
              <Card 
                key={pool.id} 
                className="overflow-hidden cursor-pointer hover:border-primary transition-all active:scale-[0.98]"
                onClick={() => navigate({ to: `/pools/${pool.id}` })}
              >
                <div className="h-24 bg-primary/10 relative overflow-hidden">
                  {pool.cover_image_url ? (
                    <img src={pool.cover_image_url} alt={pool.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Trophy className="h-20 w-20" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider">
                    {pool.type === 'advanced' ? '🔥 Avançado' : '🟢 Simples'}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{pool.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> 12 membros</span>
                        <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> 104 jogos</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
