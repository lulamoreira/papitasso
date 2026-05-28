import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createPool, getTeams } from "@/lib/api.functions";
import { HELP_TEXTS } from "@/lib/help-texts";
import { HelpButton } from "@/components/HelpButton";
import { PrizeEditor } from "@/components/PrizeEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Trophy, Flame, CheckCircle2, Share2, Copy, Gift } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/_authenticated/pools/new")({
  component: NewPoolComponent,
});

const STEPS = [
  { id: 1, title: "Tipo" },
  { id: 2, title: "Configurações" },
  { id: 3, title: "Identidade" },
  { id: 4, title: "Pontuação" },
  { id: 5, title: "Prêmios" },
  { id: 6, title: "Convite" },
];

function NewPoolComponent() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    type: "simple",
    scope_type: "full_tournament",
    scope_config: {},
    modes_enabled: ["exact"],
    name: "",
    scoring_config: { exact: 10, diff_winner: 5, winner: 3, miss: 0 },
    prizes: [],
  });
  const [createdPool, setCreatedPool] = useState<any>(null);

  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });
  const singleTeamValue = useMemo(() => {
    if (formData.scope_type === 'single_team' && formData.scope_config?.team_code) {
      return formData.scope_config.team_code;
    }
    return "";
  }, [formData.scope_type, formData.scope_config]);
  const navigate = useNavigate();

  const createPoolMutation = useMutation({
    mutationFn: (data: any) => createPool({ data }),
    onSuccess: (data: any) => {
      setCreatedPool(data);
      setStep(6);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar bolão"),
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const progress = (step / STEPS.length) * 100;

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Dê um nome ao seu bolão!");
      return;
    }
    createPoolMutation.mutate(formData);
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${createdPool?.invite_code}` : '';

  const copyInvite = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado!");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Participe do meu bolão ${createdPool?.name} no PapiteAI! Use o código: ${createdPool?.invite_code} ou o link: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 px-4 py-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevStep} disabled={step === 1 || step === 6}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-lg font-bold">{STEPS[step - 1].title}</h1>
            <div className="w-full max-w-[150px] mt-1">
              <Progress value={progress} className="h-1" />
            </div>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl p-4 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 space-y-6 pt-4"
          >
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card 
                  className={`relative cursor-pointer transition-all border-2 ${formData.type === 'simple' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setFormData({ ...formData, type: 'simple' })}
                >
                  <div className="absolute top-2 right-2">
                    <HelpButton {...HELP_TEXTS.pool_simple} />
                  </div>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">🟢 Bolão Simples</h3>
                      <p className="text-sm text-muted-foreground">Só placar dos jogos. Rápido de criar.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`relative cursor-pointer transition-all border-2 ${formData.type === 'advanced' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setFormData({ ...formData, type: 'advanced' })}
                >
                  <div className="absolute top-2 right-2">
                    <HelpButton {...HELP_TEXTS.pool_advanced} />
                  </div>
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Flame className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">🔥 Bolão Avançado</h3>
                      <p className="text-sm text-muted-foreground">Vários modos + ranking unificado.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 2 && formData.type === 'simple' && (
              <div className="space-y-4">
                {[
                  { id: 'single_team', key: 'scope_single_team', label: 'Uma seleção' },
                  { id: 'single_group', key: 'scope_single_group', label: 'Um grupo' },
                  { id: 'multiple_groups', key: 'scope_multiple_groups', label: 'Múltiplos grupos' },
                  { id: 'phase', key: 'scope_phase', label: 'Fase específica' },
                  { id: 'full_tournament', key: 'scope_full', label: 'Copa inteira' },
                ].map((opt: any) => (
                  <Card 
                    key={opt.id}
                    className={`relative cursor-pointer transition-all border-2 ${formData.scope_type === opt.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setFormData({ ...formData, scope_type: opt.id })}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${formData.scope_type === opt.id ? 'border-primary' : 'border-muted'}`}>
                          {formData.scope_type === opt.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <span className="font-semibold">{opt.label}</span>
                      </div>
                      <HelpButton {...(HELP_TEXTS as any)[opt.key]} />
                    </CardContent>
                  </Card>
                ))}
                {formData.scope_type === 'single_team' && (
                  <Card className="p-4 border-2 border-primary/20">
                    <div className="space-y-3">
                      <Label className="text-sm font-bold uppercase tracking-wider">Escolha a Seleção</Label>
                      <select 
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={singleTeamValue}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          scope_config: { team_code: e.target.value } 
                        })}
                      >
                        <option value="">Selecione...</option>
                        {teams?.map((team: any) => (
                          <option key={team.code} value={team.code}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {step === 2 && formData.type === 'advanced' && (
              <div className="space-y-4">
                {[
                  { id: 'exact', key: 'mode_exact', label: 'Placar Exato', forced: true },
                  { id: 'pickem', key: 'mode_pickem', label: "Pick'em (Quem vence)" },
                  { id: 'survivor', key: 'mode_survivor', label: 'Survivor' },
                  { id: 'bracket', key: 'mode_bracket', label: 'Bracket Challenge' },
                  { id: 'fantasy', key: 'mode_fantasy', label: 'Fantasy' },
                  { id: 'props', key: 'mode_props', label: 'Props (Apostas curiosas)' },
                ].map((opt: any) => (
                  <Card key={opt.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id={opt.id} 
                          checked={formData.modes_enabled.includes(opt.id)}
                          disabled={opt.forced}
                          onCheckedChange={(checked) => {
                            const current = [...formData.modes_enabled];
                            if (checked) {
                              setFormData({ ...formData, modes_enabled: [...current, opt.id] });
                            } else {
                              setFormData({ ...formData, modes_enabled: current.filter(id => id !== opt.id) });
                            }
                          }}
                        />
                        <Label htmlFor={opt.id} className="font-semibold cursor-pointer">{opt.label}</Label>
                      </div>
                      <HelpButton {...(HELP_TEXTS as any)[opt.key]} />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Nome do Bolão</Label>
                  <Input 
                    placeholder="Ex: Amigos do Futebol, Firma 2026..." 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Tema Visual</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {['standard', 'modern', 'classic'].map((theme) => (
                      <div 
                        key={theme}
                        className={`h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${formData.theme === theme ? 'border-primary bg-primary/10 font-bold' : 'bg-muted/30'}`}
                        onClick={() => setFormData({ ...formData, theme })}
                      >
                        {theme.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'exact', label: 'Placar exato' },
                    { id: 'diff_winner', label: 'Saldo + vencedor' },
                    { id: 'winner', label: 'Só vencedor' },
                    { id: 'miss', label: 'Erro' },
                  ].map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                      <Label>{field.label}</Label>
                      <Input 
                        type="number" 
                        className="w-20 text-center"
                        value={formData.scoring_config[field.id]}
                        onChange={(e) => setFormData({
                          ...formData,
                          scoring_config: { ...formData.scoring_config, [field.id]: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setFormData({ ...formData, scoring_config: { exact: 10, diff_winner: 5, winner: 3, miss: 0 } })}
                >
                  Restaurar padrão
                </Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold">Definir Prêmios</h2>
                  <p className="text-sm text-muted-foreground">Recompense os melhores colocados do seu bolão.</p>
                </div>
                
                <PrizeEditor 
                  prizes={formData.prizes} 
                  onChange={(prizes) => setFormData({ ...formData, prizes })} 
                />

                <div className="pt-4">
                  <Button variant="link" className="w-full text-muted-foreground" onClick={() => {
                    setFormData({ ...formData, prizes: [] });
                    handleCreate();
                  }}>
                    Pular — adicionar depois
                  </Button>
                </div>
              </div>
            )}

            {step === 6 && createdPool && (
              <div className="space-y-8 flex flex-col items-center text-center">
                <div className="space-y-2">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Bolão Criado!</h2>
                  <p className="text-muted-foreground">Agora convide seus amigos para a disputa.</p>
                </div>

                <div className="p-4 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG value={shareUrl} size={180} />
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border justify-between">
                    <span className="font-mono font-bold tracking-widest text-lg">{createdPool.invite_code}</span>
                    <Button variant="ghost" size="sm" onClick={copyInvite}><Copy className="h-4 w-4" /></Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={copyInvite} variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" /> Link
                    </Button>
                    <Button onClick={shareWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 border-none">
                      <Share2 className="h-4 w-4" /> WhatsApp
                    </Button>
                  </div>
                </div>

                <Button className="w-full h-12" onClick={() => navigate({ to: `/pools/${createdPool.id}` })}>
                  Ir para o Bolão
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step < 6 && (
          <div className="pt-8 pb-4">
            <Button 
              className="w-full h-12 text-lg font-bold gap-2"
              onClick={step === 5 ? handleCreate : nextStep}
              disabled={createPoolMutation.isPending}
            >
              {createPoolMutation.isPending ? "Criando..." : step === 5 ? "Finalizar e Criar" : "Próximo"}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
