import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Shield, Zap, Diamond, Lock, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareModal } from "./ShareModal";
import { Button } from "@/components/ui/button";


interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
  unlocked_at?: string;
}

const rarityColors = {
  common: "text-slate-400 border-slate-400/20",
  rare: "text-blue-400 border-blue-400/20",
  epic: "text-purple-400 border-purple-400/20",
  legendary: "text-yellow-500 border-yellow-500/20",
};

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {achievements.map((achievement, index) => (
        <TooltipProvider key={achievement.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-xl border-2 bg-muted/30 transition-all",
                  achievement.unlocked_at 
                    ? cn("bg-background shadow-md", rarityColors[achievement.rarity]) 
                    : "opacity-40 grayscale"
                )}
              >
                {achievement.unlocked_at ? (
                  <div className="relative">
                    <Trophy className="h-8 w-8" />
                    {achievement.rarity === 'legendary' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-1 border border-dashed border-yellow-500 rounded-full"
                      />
                    )}
                  </div>
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-center p-3">
              <p className="font-bold text-primary">{achievement.name}</p>
              <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
              <div className="flex items-center justify-between text-[10px] uppercase font-bold">
                <span className={rarityColors[achievement.rarity]}>{achievement.rarity}</span>
                <span className="text-yellow-500">+{achievement.xp_reward} XP</span>
              </div>
              {achievement.unlocked_at && (
                <p className="text-[10px] mt-2 border-t pt-1 border-white/10 italic">
                  Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}
