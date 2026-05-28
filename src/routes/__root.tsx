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
      { title: "GolPalpite | Copa 2026" },
      { name: "description", content: "Sua plataforma de bolão da Copa do Mundo 2026" },
      { property: "og:title", content: "GolPalpite | Copa 2026" },
      { name: "twitter:title", content: "GolPalpite | Copa 2026" },
      { property: "og:description", content: "Sua plataforma de bolão da Copa do Mundo 2026" },
      { name: "twitter:description", content: "Sua plataforma de bolão da Copa do Mundo 2026" },
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

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  const router = useRouter();

  console.error("Root Error:", error);

  // Handle Unauthorized errors by redirecting to login
  if (
    error?.message?.includes('Unauthorized') || 
    error?.message?.includes('No authorization header') ||
    error?.status === 401
  ) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-full" />
          <p className="text-sm font-medium text-muted-foreground italic">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 bg-background">
      <div className="text-7xl">⚽</div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-black text-primary uppercase italic tracking-tighter">Ops, o lance foi para o VAR</h1>
        <p className="text-muted-foreground">{error?.message || "Não conseguimos carregar esta tela agora."}</p>
        {error && (
          <pre className="mt-4 p-2 bg-muted rounded text-[10px] text-muted-foreground text-left overflow-auto max-h-40 whitespace-pre-wrap">
            {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
          </pre>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="font-bold"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Tentar novamente
        </Button>
        <Button variant="outline" onClick={() => router.navigate({ to: "/" })}>
          Voltar para a Home
        </Button>
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

