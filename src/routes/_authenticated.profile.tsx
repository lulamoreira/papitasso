import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, LogOut, ChevronLeft, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() });
  },
  component: ProfileComponent,
});

function ProfileComponent() {
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [name, setName] = useState(profile?.name || "");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => updateProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Meu Perfil</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-lg p-4 pt-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-primary bg-muted">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name || ""} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary">{profile?.name || "Jogador"}</h2>
            <p className="text-muted-foreground">{profile?.league_tier} • {profile?.xp} XP</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleção do Coração</label>
              {profile?.favorite_team && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <img src={profile.favorite_team.flag_url} alt={profile.favorite_team.name} className="h-6 w-8 object-cover rounded shadow-sm" />
                  <span className="font-bold">{profile.favorite_team.name}</span>
                </div>
              )}
              <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate({ to: "/onboarding" })}>
                Alterar seleção
              </Button>
            </div>

            <Button className="w-full gap-2" onClick={() => updateMutation.mutate({ name })} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full gap-2 h-12" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </Button>
      </main>
    </div>
  );
}
