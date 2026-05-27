import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeams, getProfile, updateProfile } from "@/lib/api.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Trophy, Sparkles, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["teams"], queryFn: () => getTeams() }),
      context.queryClient.ensureQueryData({ queryKey: ["profile"], queryFn: () => getProfile() }),
    ]);
  },
  component: OnboardingComponent,
});

function OnboardingComponent() {
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  
  const [step, setStep] = useState(profile?.favorite_team_id ? 2 : 1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tourStep, setTourStep] = useState(0);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const updateProfileMutation = useMutation({
    mutationFn: (data: { favorite_team_id?: string; name?: string; avatar_url?: string }) => updateProfile({ data: data as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setStep(2);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar seleção");
    }
  });

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tourData = [
    {
      title: "Crie seus bolões",
      desc: "Chame os amigos e veja quem entende mais de futebol.",
      icon: <Trophy className="h-12 w-12 text-primary" />
    },
    {
      title: "Palpite em tempo real",
      desc: "Acompanhe os 104 jogos da Copa do Mundo 2026.",
      icon: <Target className="h-12 w-12 text-primary" />
    },
    {
      title: "Suba no ranking",
      desc: "Comece no Bronze e chegue até a liga de Diamante.",
      icon: <Sparkles className="h-12 w-12 text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Seleção do Coração</h1>
              <p className="text-muted-foreground">Escolha para quem você vai torcer na Copa 2026</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar seleção..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
              {filteredTeams.map((team) => (
                <Card 
                  key={team.id}
                  className="cursor-pointer hover:border-primary transition-all active:scale-95 overflow-hidden"
                  onClick={() => updateProfileMutation.mutate({ favorite_team_id: team.id })}
                >
                  <CardContent className="p-3 flex flex-col items-center gap-2">
                    <img src={team.flag_url} alt={team.name} className="h-10 w-14 object-cover rounded shadow-sm" />
                    <span className="text-sm font-medium text-center line-clamp-1">{team.name}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  {tourData[tourStep].icon}
                </div>
                <CardTitle className="text-2xl">{tourData[tourStep].title}</CardTitle>
                <CardDescription className="text-base">{tourData[tourStep].desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="flex justify-center gap-2">
                  {tourData.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${i === tourStep ? "w-8 bg-primary" : "w-2 bg-muted"}`}
                    />
                  ))}
                </div>
                
                <Button 
                  className="w-full h-12 text-lg font-bold"
                  onClick={() => {
                    if (tourStep < tourData.length - 1) {
                      setTourStep(s => s + 1);
                    } else {
                      navigate({ to: "/" });
                    }
                  }}
                >
                  {tourStep < tourData.length - 1 ? "Próximo" : "Começar Agora!"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
