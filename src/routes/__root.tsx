import { createFileRoute, redirect, Outlet, useRouter } from "@tanstack/react-router";
import { useQueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

import appCss from "../styles.css?url";


export const Route = createRootRouteWithContext<{ queryClient: any }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Palpitasso da Copa 2026" },
      { name: "description", content: "Sua plataforma de bolão da Copa do Mundo 2026" },
      { property: "og:title", content: "Palpitasso da Copa 2026" },
      { name: "twitter:title", content: "Palpitasso da Copa 2026" },
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
          className="min-h-screen"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-center" expand={false} richColors />
    </QueryClientProvider>
  );
}

import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
