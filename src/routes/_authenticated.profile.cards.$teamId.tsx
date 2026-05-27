import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getTeams, getCollectedCards } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { TeamCard } from "@/components/gamification/TeamCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile/cards/$teamId")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
      context.queryClient.ensureQueryData({ queryKey: ["collected_cards"], queryFn: () => getCollectedCards() }),
    ]);
  },
  component: TeamCardDetailsComponent,
});

function TeamCardDetailsComponent() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });
  const { data: collectedCards } = useSuspenseQuery({ queryKey: ["collected_cards"], queryFn: () => getCollectedCards() });
  
  const team = teams?.find(t => t.id === teamId);
  const card = collectedCards?.find(c => c.team_id === teamId);

  if (!team || !card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-bold mb-4">Card não encontrado ou não coletado</h2>
        <Button onClick={() => navigate({ to: "/profile" })}>Voltar ao Álbum</Button>
      </div>
    );
  }

  const handleShare = () => {
    // In a real app, this would use a library like html-to-image or a server function
    toast.info("Funcionalidade de compartilhar imagem será implementada em breve com Lovable AI!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/profile" })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Card da Seleção</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-lg p-8">
        <TeamCard 
          team={team as any} 
          level={card.level} 
          onShare={handleShare}
        />
        
        <div className="mt-12 space-y-4">
          <h3 className="font-bold uppercase text-xs tracking-widest text-muted-foreground text-center">Histórico do Card</h3>
          <div className="bg-muted/30 rounded-xl p-4 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Coletado em</span>
              <span className="font-bold">{new Date(card.acquired_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted-foreground">Nível Atual</span>
              <span className="font-bold text-yellow-500">Nível {card.level}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="font-bold text-primary">{card.level === 5 ? "Raridade Ouro" : "Raridade Padrão"}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
