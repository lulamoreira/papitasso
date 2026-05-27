import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPoolById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Share2, Settings, Trophy, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pools/$id")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) });
  },
  component: PoolDetailComponent,
});

function PoolDetailComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id" });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });
  const navigate = useNavigate();

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/join/${pool.invite_code}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link do convite copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/pools" })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-bold truncate">{pool.name}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              {pool.type === 'advanced' ? '🔥 Bolão Avançado' : '🟢 Bolão Simples'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 pb-20">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Posição</div>
            <div className="text-2xl font-bold text-primary">--</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Pontos</div>
            <div className="text-2xl font-bold text-primary">0</div>
          </div>
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Jogos</div>
            <div className="text-2xl font-bold text-primary">0/104</div>
          </div>
        </div>

        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="matches" className="gap-2"><Calendar className="h-4 w-4" /> Jogos</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-2"><Trophy className="h-4 w-4" /> Ranking</TabsTrigger>
            <TabsTrigger value="members" className="gap-2"><Users className="h-4 w-4" /> Membros</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="py-20 text-center space-y-4">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Em breve: Liste e palpite nos jogos aqui.</p>
          </TabsContent>
          
          <TabsContent value="ranking" className="py-20 text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Em breve: Ranking em tempo real.</p>
          </TabsContent>
          
          <TabsContent value="members" className="py-20 text-center space-y-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-muted-foreground">Em breve: Gerencie os participantes.</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
