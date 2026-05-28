import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useQueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";


import appCss from "../styles.css?url";


export const Route = createRootRouteWithContext<{ queryClient: any }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PapiteAI | Bolão Copa 2026" },
      { name: "description", content: "Seu bolão da Copa do Mundo 2026 com IA, prêmios e diversão garantida" },
      { property: "og:title", content: "PapiteAI | Bolão Copa 2026" },
      { name: "twitter:title", content: "PapiteAI | Bolão Copa 2026" },
      { property: "og:description", content: "Seu bolão da Copa do Mundo 2026 com IA, prêmios e diversão garantida" },
      { name: "twitter:description", content: "Seu bolão da Copa do Mundo 2026 com IA, prêmios e diversão garantida" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/51c6ac36-9a10-42ea-acb3-b2a29c5322a1/id-preview-94b2c48f--267ed4fe-2c33-49a8-87e2-f2a2248b855c.lovable.app-1779913580336.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/51c6ac36-9a10-42ea-acb3-b2a29c5322a1/id-preview-94b2c48f--267ed4fe-2c33-49a8-87e2-f2a2248b855c.lovable.app-1779913580336.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.state.location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="min-h-screen relative"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-center" expand={false} richColors />
    </QueryClientProvider>
  );
}

function ErrorComponent({ error }: { error: any; reset: () => void }) {
  // Detecta redirect do TanStack que perdeu a tag isRedirect (após travessia serializada)
  const errAny = error as any;
  const isRedirectShaped = 
    errAny?.isRedirect || 
    errAny?.options?.to || 
    (errAny?.options && typeof errAny.options === 'object' && 'to' in errAny.options);
  
  if (isRedirectShaped) {
    const to = errAny.options?.to || '/login';
    const search = errAny.options?.search;
    if (typeof window !== 'undefined') {
      const searchStr = search ? '?' + new URLSearchParams(search).toString() : '';
      window.location.href = to + searchStr;
    }
    return <div className="min-h-screen flex items-center justify-center">Redirecionando...</div>;
  }

  const message = error?.message || 'Erro desconhecido';
  
  // Trata erro customizado do middleware de auth
  if (message.startsWith('AUTH_REQUIRED:')) {
    const redirectPath = message.split(':')[1] || '/login';
    if (typeof window !== 'undefined') window.location.href = redirectPath;
    return <div className="min-h-screen flex items-center justify-center">Redirecionando...</div>;
  }

  if (message.includes('Unauthorized') || message.includes('No authorization header')) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return <div className="min-h-screen flex items-center justify-center">Redirecionando...</div>;
  }

  const stack = error?.stack || 'Stack indisponível';
  const cause = (error as any)?.cause ? JSON.stringify((error as any).cause, null, 2) : null;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 bg-background">
      <div className="space-y-4 max-w-lg w-full">
        <h1 className="text-4xl font-black text-primary uppercase italic tracking-tighter">OPS, O LANCE FOI PARA O VAR</h1>
        <p className="text-muted-foreground">Não conseguimos carregar esta tela agora.</p>
        
        <details className="text-left bg-muted/50 p-4 rounded-lg border border-border">
          <summary className="text-sm font-bold cursor-pointer hover:text-primary transition-colors">Detalhes do erro (debug)</summary>
          <div className="mt-4 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Mensagem</span>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{message}</pre>
            </div>
            {cause && (
              <div>
                <span className="text-xs font-bold uppercase text-muted-foreground">Causa</span>
                <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-40">{cause}</pre>
              </div>
            )}
            <div>
              <span className="text-xs font-bold uppercase text-muted-foreground">Stack Trace</span>
              <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-auto max-h-40 font-mono">{stack}</pre>
            </div>
          </div>
        </details>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button size="lg" className="flex-1 font-bold" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
          <Button size="lg" variant="outline" className="flex-1 font-bold" onClick={() => window.location.href = '/'}>
            Voltar para Home
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-8xl"
      >
        😢
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-primary uppercase italic tracking-tighter">404 - Fora de Jogo!</h1>
        <p className="text-muted-foreground">O mascote está chorando porque não encontrou essa página.</p>
      </div>
      <Button size="lg" className="font-bold gap-2" onClick={() => navigate({ to: "/" })}>
        Voltar para a Home
      </Button>
    </div>
  );
}

