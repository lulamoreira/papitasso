import { motion } from "framer-motion";
import { Star, Share2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    code: string;
    flag_url: string;
    fifa_ranking?: number;
    group_letter?: string;
  };
  level: number;
  onShare?: () => void;
}

export function TeamCard({ team, level, onShare }: TeamCardProps) {
  const isGold = level === 5;

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="perspective-1000 w-full max-w-[320px] mx-auto"
    >
      <div className={cn(
        "relative aspect-[2/3] rounded-2xl overflow-hidden border-8 shadow-2xl transition-all p-4",
        isGold 
          ? "border-yellow-500 bg-gradient-to-br from-yellow-600 via-yellow-400 to-yellow-600" 
          : "border-primary bg-gradient-to-br from-primary/80 to-primary-foreground"
      )}>
        {/* Shine effect for Gold */}
        {isGold && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
          />
        )}

        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
            <span className="text-sm font-black text-primary">{team.code}</span>
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn("h-4 w-4", i < level ? "fill-yellow-400 text-yellow-400" : "text-white/30")} 
              />
            ))}
          </div>
        </div>

        {/* Flag Container */}
        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-white/50 shadow-inner mb-6 bg-white/10">
          <img src={team.flag_url} alt={team.name} className="h-full w-full object-cover" />
        </div>

        {/* Team Name */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-md">
            {team.name}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-center">
            <p className="text-[10px] text-white/70 uppercase font-bold">Ranking FIFA</p>
            <p className="text-lg font-black text-white">{team.fifa_ranking || '--'}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 text-center">
            <p className="text-[10px] text-white/70 uppercase font-bold">Grupo</p>
            <p className="text-lg font-black text-white">{team.group_letter || '--'}</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-center">
          <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
            GolPalpite Copa '26
          </div>
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
            <Info className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={onShare} className="flex-1 gap-2 h-12 text-lg font-bold" variant={isGold ? "default" : "outline"}>
          <Share2 className="h-5 w-5" />
          Compartilhar Card
        </Button>
      </div>
    </motion.div>
  );
}
