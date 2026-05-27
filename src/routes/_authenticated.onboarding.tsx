import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeams, getProfile, updateProfile } from "@/lib/api.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Trophy, Sparkles, Target, Share2, Award } from "lucide-react";
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
      title: "Palpite em seus jogos favoritos",
      desc: "Preencha os placares e mostre que você é o mestre da previsão.",
      icon: (
        <div className="relative h-20 w-32 bg-muted rounded-lg border-2 border-primary/20 flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ y: 20 }}
            animate={{ y: [20, 0, 0, 20] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex gap-2"
          >
            <div className="w-8 h-10 bg-primary/10 rounded flex items-center justify-center font-black text-primary">2</div>
            <div className="w-8 h-10 bg-primary/10 rounded flex items-center justify-center font-black text-primary">1</div>
          </motion.div>
          <div className="absolute top-1 right-1"><Sparkles className="w-3 h-3 text-yellow-500" /></div>
        </div>
      )
    },
    {
      title: "Convide a galera",
      desc: "Crie seu bolão em segundos e compartilhe via WhatsApp ou QR Code.",
      icon: (
        <div className="flex gap-1 items-end h-16">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-3 bg-green-500 rounded-lg"><Share2 className="text-white w-6 h-6" /></motion.div>
          <div className="p-2 bg-muted rounded-lg"><div className="w-6 h-6 bg-muted-foreground/20 rounded-sm" /></div>
          <div className="p-2 bg-muted rounded-lg"><div className="w-6 h-6 bg-muted-foreground/20 rounded-sm" /></div>
        </div>
      )
    },
    {
      title: "Suba no ranking, ganhe prêmios",
      desc: "Acumule XP, colecione cards Super Trunfo e dispute prêmios físicos.",
      icon: (
        <motion.div 
          animate={{ rotate: [0, -5, 5, 0], y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="relative"
        >
          <Trophy className="h-16 w-16 text-yellow-500 fill-yellow-500/20" />
          <Award className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-bounce" />
        </motion.div>
      )
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
