import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getNextMatch, getProfile } from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, User, Hash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() }),
      context.queryClient.ensureQueryData({ queryKey: ["nextMatch"], queryFn: () => getNextMatch() }),
    ]);
  },
  component: DashboardComponent,
});

function DashboardComponent() {
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: nextMatch } = useSuspenseQuery({ queryKey: ["nextMatch"], queryFn: () => getNextMatch() });
  const navigate = useNavigate();

  if (!profile?.favorite_team_id) {
    throw redirect({ to: "/onboarding" });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">GolPalpite</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile.name || "Jogador"}</p>
              <p className="text-xs text-muted-foreground">{profile.xp} XP • {profile.league_tier}</p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name || "User"} className="h-full w-full object-cover" /> : <User className="h-full w-full p-2 text-muted-foreground" />}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 p-4 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold">Olá, {profile.name || "jogador"}! 👋</h1>
          <p className="text-muted-foreground">Pronto para palpitar nos próximos jogos?</p>
        </motion.div>

        {nextMatch && nextMatch.home_team && nextMatch.away_team && (
          <Card className="overflow-hidden border-none bg-primary text-primary-foreground shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-80">Próximo Jogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <img src={nextMatch.home_team.flag_url || ""} alt={nextMatch.home_team.name} className="h-12 w-16 rounded object-cover shadow-sm" />
                  <span className="text-center text-sm font-bold">{nextMatch.home_team.name}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-black">VS</span>
                  <span className="text-[10px] opacity-80 uppercase font-medium">
                    {nextMatch.kickoff_at ? format(new Date(nextMatch.kickoff_at), "dd MMM 'às' HH:mm", { locale: ptBR }) : "TBA"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-1/3">
                  <img src={nextMatch.away_team.flag_url || ""} alt={nextMatch.away_team.name} className="h-12 w-16 rounded object-cover shadow-sm" />
                  <span className="text-center text-sm font-bold">{nextMatch.away_team.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card 
            className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 border-dashed transition-colors hover:bg-muted/50"
            onClick={() => navigate({ to: "/pools/new" })}
          >
            <Plus className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Criar novo bolão</span>
          </Card>
          <Card 
            className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 border-dashed transition-colors hover:bg-muted/50"
            onClick={() => navigate({ to: "/pools" })}
          >
            <Hash className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Meus bolões</span>
          </Card>
        </div>
      </main>
    </div>
  );
}
