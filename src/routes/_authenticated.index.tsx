import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { getNextMatch, getProfile, getDailyQuiz, getQuizUserStatus } from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, User, Hash, Zap, ChevronRight, Brain } from "lucide-react";
import { toast } from "sonner";

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

function QuizCard() {
  const navigate = useNavigate();
  const { data: quiz } = useQuery({ queryKey: ["daily-quiz"], queryFn: () => getDailyQuiz() });
  const { data: userStatus } = useQuery({ 
    queryKey: ["quiz-status", quiz?.id], 
    queryFn: () => quiz?.id ? getQuizUserStatus({ data: quiz.id }) : Promise.resolve(null),
    enabled: !!quiz?.id
  });

  return (
    <Card className="overflow-hidden border-2 border-primary/10 shadow-md">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Quiz do Dia
          </CardTitle>
          {userStatus && (
            <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">
              CONCLUÍDO
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {userStatus ? (
          <div className="flex items-center gap-3">
             <div className="p-2 bg-green-500/10 rounded-full">
               <Zap className="w-5 h-5 text-green-600" />
             </div>
             <div>
               <p className="text-sm font-medium">Você já respondeu hoje!</p>
               <p className="text-xs text-muted-foreground">Volte amanhã para manter o streak.</p>
             </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-snug">Ganhe XP extra testando seus conhecimentos de Copa!</p>
            <Button className="w-full gap-2" onClick={() => navigate({ to: "/quiz" })}>
              Jogar Agora
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Whistle/Cheer placeholder
            audio.play().catch(() => {});
            toast.success("🇧🇷 É HEXA! 🇧🇷", { icon: "⚽" });
          }}>
            <Trophy className="h-6 w-6 text-primary transition-transform active:scale-125" />
            <span className="text-xl font-black text-primary tracking-tighter italic">PAPITEAI</span>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {nextMatch && (
              <Card className="overflow-hidden border-none bg-primary text-primary-foreground shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-80">Próximo Jogo</CardTitle>
                  <div className="text-[11px] opacity-90 font-medium mt-0.5">
                    Copa do Mundo FIFA 2026 ·{" "}
                    {nextMatch.phase === 'group'
                      ? `Fase de Grupos${nextMatch.home_team?.group_letter ? ` — Grupo ${nextMatch.home_team.group_letter}` : ''}`
                      : nextMatch.phase === 'round_of_32' ? 'Fase Eliminatória (32)'
                      : nextMatch.phase === 'round_of_16' ? 'Oitavas de Final'
                      : nextMatch.phase === 'quarter' ? 'Quartas de Final'
                      : nextMatch.phase === 'semi' ? 'Semifinal'
                      : nextMatch.phase === 'third' ? 'Disputa de 3º Lugar'
                      : nextMatch.phase === 'final' ? 'FINAL'
                      : 'Mata-mata'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {!nextMatch.home_team || !nextMatch.away_team ? (
                      <div className="flex-1 text-center py-2">
                        <div className="text-lg font-black tracking-tight">
                          {nextMatch.placeholder_label || 'A definir'}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col items-center gap-2 w-1/3">
                          <img src={nextMatch.home_team?.flag_url || ""} alt={nextMatch.home_team?.name} className="h-12 w-16 rounded object-cover shadow-sm" />
                          <span className="text-center text-sm font-bold truncate w-full">{nextMatch.home_team?.name}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl font-black italic tracking-tighter">VS</span>
                          <span className="text-[10px] opacity-80 uppercase font-medium">
                            {nextMatch.kickoff_at ? format(new Date(nextMatch.kickoff_at), "dd MMM 'às' HH:mm", { locale: ptBR }) : "TBA"}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/3">
                          <img src={nextMatch.away_team?.flag_url || ""} alt={nextMatch.away_team?.name} className="h-12 w-16 rounded object-cover shadow-sm" />
                          <span className="text-center text-sm font-bold truncate w-full">{nextMatch.away_team?.name}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {(nextMatch.venue?.name || nextMatch.stadium || nextMatch.city || nextMatch.country) && (
                    <div className="mt-4 pt-3 border-t border-white/20 text-[11px] opacity-90 text-center font-medium">
                      📍 {nextMatch.venue?.name || nextMatch.stadium}
                      {(nextMatch.venue?.city || nextMatch.city) && ` · ${nextMatch.venue?.city || nextMatch.city}`}
                      {(nextMatch.venue?.country || nextMatch.country) && `, ${nextMatch.venue?.country || nextMatch.country}`}
                    </div>
                  )}
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
          </div>

          <div className="space-y-6">
            <QuizCard />
            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30">
               <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-900 dark:text-amber-100">Dica da IA</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    Use o <b>Modo Preguiça</b> dentro de um bolão para receber sugestões baseadas no Ranking FIFA e estatísticas históricas!
                  </p>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
