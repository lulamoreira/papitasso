// TODO: habilitar Facebook provider em Lovable Cloud → Users → Auth settings (precisa App ID e Secret do Facebook Developers)
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Sparkles, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginBackground } from "@/components/LoginBackground";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { icon: <Trophy className="h-8 w-8 text-primary" />, text: "Crie bolões com amigos" },
    { icon: <Target className="h-8 w-8 text-primary" />, text: "Palpites em tempo real" },
    { icon: <Sparkles className="h-8 w-8 text-primary" />, text: "Ganhe prêmios exclusivos" },
    { icon: <Brain className="h-8 w-8 text-primary" />, text: "Quiz e Desafios de IA" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSocialLogin = async (provider: "google" | "apple" | "facebook") => {
    try {
      const result = await lovable.auth.signInWithOAuth(provider as any, {
        redirect_uri: window.location.origin + search.redirect,
      });
      if (result.error) throw result.error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login social");
    }
  };


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = search.redirect;
    } catch (error: any) {
      toast.error(error.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <LoginBackground />
      
      <Card className="relative z-10 w-full max-w-md border-none bg-white/95 shadow-2xl backdrop-blur-sm dark:bg-slate-900/95">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 relative overflow-hidden border-4 border-white shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                className="absolute flex items-center justify-center"
              >
                {slides[currentSlide].icon}
              </motion.div>
            </AnimatePresence>
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter text-primary uppercase italic drop-shadow-sm">
            GolPalpite
          </CardTitle>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentSlide}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
            >
              {slides[currentSlide].text}
            </motion.p>
          </AnimatePresence>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            <Button variant="outline" size="lg" className="w-full justify-start gap-4 py-6 text-base hover:bg-primary/5 hover:border-primary transition-all duration-300" onClick={() => handleSocialLogin("google")}>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar com Google
            </Button>
            <Button variant="outline" size="lg" className="w-full justify-start gap-4 py-6 text-base hover:bg-primary/5 hover:border-primary transition-all duration-300" onClick={() => handleSocialLogin("apple")}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.96.95-2.01 1.95-3.32 1.95-1.28 0-1.72-.81-3.21-.81-1.48 0-1.98.78-3.19.81-1.28.03-2.48-1.1-3.48-2.48-2.04-2.84-3.6-8.01-1.5-11.64 1.05-1.8 2.88-2.94 4.88-2.97 1.51-.03 2.94 1.02 3.86 1.02.93 0 2.67-1.29 4.47-1.11.75.03 2.85.3 4.2 2.22-1.1.66-1.85 1.68-1.85 3.3 0 2 1.63 2.94 3.42 3.39-.14.41-.53 1.05-1.07 1.83zM12.03 4.86c-.01-1.89 1.55-3.51 3.42-3.63.03.18.06.37.06.56 0 1.76-1.43 3.52-3.41 3.52-.02-.15-.07-.3-.07-.45z" />
              </svg>
              Continuar com Apple
            </Button>
            <Button variant="outline" size="lg" className="w-full justify-start gap-4 py-6 text-base hover:bg-primary/5 hover:border-primary transition-all duration-300" onClick={() => handleSocialLogin("facebook")}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continuar com Facebook
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground font-semibold">Ou com e-mail</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted/50 border-none h-12" />
            </div>
            <div className="space-y-2">
              <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-muted/50 border-none h-12" />
            </div>
            <Button type="submit" className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
