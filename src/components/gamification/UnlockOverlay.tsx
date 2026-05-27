import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface UnlockOverlayProps {
  achievement: {
    name: string;
    description: string;
    xp_reward: number;
    rarity: string;
  } | null;
  onClose: () => void;
}

export function UnlockOverlay({ achievement, onClose }: UnlockOverlayProps) {
  useEffect(() => {
    if (achievement) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [achievement]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        >
          <motion.div
            initial={{ scale: 0.5, rotateY: 90 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-full max-w-sm bg-gradient-to-b from-primary/20 to-background border-2 border-primary/50 rounded-3xl p-8 text-center relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />

            <div className="relative z-10">
              <div className="mx-auto w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 border-4 border-primary">
                <Trophy className="h-12 w-12 text-primary" />
              </div>

              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-2">
                Conquista Desbloqueada!
              </h2>
              
              <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">
                {achievement.name}
              </h1>

              <p className="text-muted-foreground mb-8 text-lg">
                {achievement.description}
              </p>

              <div className="flex flex-col gap-4">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Recompensa</p>
                  <p className="text-3xl font-black text-yellow-500">+{achievement.xp_reward} XP</p>
                </div>

                <Button onClick={onClose} size="lg" className="w-full text-lg font-black h-14 rounded-2xl">
                  INCRÍVEL!
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
