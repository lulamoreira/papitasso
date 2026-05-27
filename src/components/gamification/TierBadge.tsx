import { motion } from "framer-motion";
import { Trophy, Star, Shield, Zap, Diamond, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export type TierType = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante' | 'lendario';

const tierConfigs: Record<TierType, { icon: any, color: string, label: string }> = {
  bronze: { icon: Trophy, color: "text-amber-700", label: "Bronze" },
  prata: { icon: Shield, color: "text-slate-400", label: "Prata" },
  ouro: { icon: Star, color: "text-yellow-400", label: "Ouro" },
  platina: { icon: Zap, color: "text-cyan-400", label: "Platina" },
  diamante: { icon: Diamond, color: "text-blue-400", label: "Diamante" },
  lendario: { icon: Crown, color: "text-purple-500", label: "Lendário" },
};

export function TierBadge({ tier, className }: { tier: TierType, className?: string }) {
  const config = tierConfigs[tier] || tierConfigs.bronze;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn("flex flex-col items-center gap-1", className)}
    >
      <div className={cn("relative p-3 rounded-full bg-white/10 backdrop-blur-sm border-2 shadow-lg", 
        tier === 'lendario' ? "border-purple-500 animate-pulse" : "border-white/20")}>
        <Icon className={cn("h-8 w-8", config.color)} />
      </div>
      <span className={cn("text-xs font-bold uppercase tracking-widest", config.color)}>
        {config.label}
      </span>
    </motion.div>
  );
}
