import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, getAchievements, getCollectedCards, getUserStats, getTeams, getAchievementById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, LogOut, ChevronLeft, Save, Settings, Trophy, LayoutGrid, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TierBadge, TierType } from "@/components/gamification/TierBadge";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { AchievementGrid } from "@/components/gamification/AchievementGrid";
import { TeamAlbum } from "@/components/gamification/TeamAlbum";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnlockOverlay } from "@/components/gamification/UnlockOverlay";


export const Route = createFileRoute("/_authenticated/profile")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() }),
      context.queryClient.ensureQueryData({ queryKey: ["achievements"], queryFn: () => getAchievements() }),
      context.queryClient.ensureQueryData({ queryKey: ["collected_cards"], queryFn: () => getCollectedCards() }),
      context.queryClient.ensureQueryData({ queryKey: ["user_stats"], queryFn: () => getUserStats() }),
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
    ]);
  },
  component: ProfileComponent,
});

function ProfileComponent() {
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: achievements } = useSuspenseQuery({ queryKey: ["achievements"], queryFn: () => getAchievements() });
  const { data: collectedCards } = useSuspenseQuery({ queryKey: ["collected_cards"], queryFn: () => getCollectedCards() });
  const { data: stats } = useSuspenseQuery({ queryKey: ["user_stats"], queryFn: () => getUserStats() });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });

  const [name, setName] = useState(profile?.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [newUnlock, setNewUnlock] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => updateProfile({ data: data as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
      toast.success("Perfil atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar");
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Meu Perfil</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-lg p-4 pt-6 space-y-8">
        {/* 1. Cabeçalho Gamificado */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary bg-muted shadow-xl">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name || ""} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-6 text-muted-foreground" />
              )}
            </div>
            {profile?.favorite_team && (
              <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full border-2 border-background overflow-hidden shadow-lg">
                <img src={profile.favorite_team.flag_url} alt={profile.favorite_team.name} className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">{profile?.name || "Jogador"}</h2>
              <TierBadge tier={profile?.league_tier as TierType} className="scale-75" />
            </div>
            <XPProgressBar xp={profile?.xp || 0} />
          </div>
        </section>

        {isEditing && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Nome de Exibição</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="bg-background" />
              </div>
              <Button className="w-full gap-2 font-bold" onClick={() => updateMutation.mutate({ name })} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive gap-2 font-bold" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2. Estatísticas */}
        <section className="grid grid-cols-2 gap-3">
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Palpites</p>
              <p className="text-2xl font-black">{stats?.total_predictions || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Taxa de Acerto</p>
              <p className="text-2xl font-black">{stats?.accuracy_rate || 0}%</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Placares Exatos</p>
              <p className="text-2xl font-black text-primary">{stats?.exact_scores || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Melhor Streak</p>
              <p className="text-2xl font-black text-yellow-500">{stats?.best_streak || 0}</p>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="album" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Álbum
            </TabsTrigger>
          </TabsList>

          {/* 3. Conquistas */}
          <TabsContent value="achievements" className="pt-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Minhas Medalhas</h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {achievements.filter((a: any) => a.unlocked_at).length} / {achievements.length}
              </span>
            </div>
            <AchievementGrid achievements={achievements} />
          </TabsContent>

          {/* 4. Álbum */}
          <TabsContent value="album" className="pt-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="font-bold uppercase text-xs tracking-widest text-muted-foreground">Super Trunfo Seleções</h3>
              <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                {collectedCards.length} / {teams?.length || 48} Cards
              </span>
            </div>
            <TeamAlbum teams={teams || []} collectedCards={collectedCards} />
          </TabsContent>
        </Tabs>
      </main>

      <UnlockOverlay achievement={newUnlock} onClose={() => setNewUnlock(null)} />
    </div>
  );
}

