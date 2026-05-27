import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface XPProgressBarProps {
  xp: number;
}

const tiers = [
  { name: 'bronze', min: 0, max: 500 },
  { name: 'prata', min: 500, max: 2000 },
  { name: 'ouro', min: 2000, max: 5000 },
  { name: 'platina', min: 5000, max: 10000 },
  { name: 'diamante', min: 10000, max: 20000 },
  { name: 'lendario', min: 20000, max: 100000 },
];

export function XPProgressBar({ xp }: XPProgressBarProps) {
  const currentTier = tiers.find(t => xp >= t.min && xp < t.max) || tiers[tiers.length - 1];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1] || currentTier;
  
  const progress = ((xp - currentTier.min) / (currentTier.max - currentTier.min)) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
        <span>{xp} XP</span>
        {currentTier !== nextTier && <span>{currentTier.max} XP</span>}
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
        />
      </div>
      {currentTier !== nextTier && (
        <p className="text-[10px] text-center text-muted-foreground">
          Faltam <span className="text-primary font-bold">{currentTier.max - xp} XP</span> para o próximo nível
        </p>
      )}
    </div>
  );
}
