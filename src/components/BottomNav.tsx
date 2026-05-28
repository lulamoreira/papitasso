import { useNavigate, useLocation } from "@tanstack/react-router";
import { Home, Trophy, Brain, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Início", icon: Home, to: "/" },
  { label: "Bolões", icon: Trophy, to: "/pools" },
  { label: "Quiz", icon: Brain, to: "/quiz" },
  { label: "Perfil", icon: User, to: "/profile" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on top-level routes
  const topLevelRoutes = ["/", "/pools", "/quiz", "/profile"];
  const isTopLevel = topLevelRoutes.includes(location.pathname);

  if (!isTopLevel) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[calc(64px+env(safe-area-inset-bottom))] border-t bg-background/80 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-full max-w-lg items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to || (item.to === "/pools" && location.pathname === "/pools/");
          
          return (
            <button
              key={item.to}
              onClick={() => navigate({ to: item.to })}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors px-4 py-2 rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-[22px] w-[22px]", isActive && "fill-primary/10")} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
