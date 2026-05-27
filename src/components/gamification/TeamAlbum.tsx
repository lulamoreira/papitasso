import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string;
}

interface CollectedCard {
  team_id: string;
  level: number;
}

export function TeamAlbum({ teams, collectedCards }: { teams: Team[], collectedCards: CollectedCard[] }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
      {teams.map((team, index) => {
        const collected = collectedCards.find(c => c.team_id === team.id);
        const isGold = collected?.level === 5;

        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.01 }}
            onClick={() => collected && navigate({ to: `/profile/cards/${team.id}` as any })}
            className={cn(
              "relative aspect-[3/4] rounded-md overflow-hidden border cursor-pointer group transition-all hover:scale-105",
              collected 
                ? isGold 
                  ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                  : "border-primary/20"
                : "border-muted opacity-30 grayscale saturate-0"
            )}
          >
            {collected ? (
              <>
                <img src={team.flag_url} alt={team.name} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1">
                  <p className="text-[8px] font-bold text-white text-center truncate">{team.name}</p>
                </div>
                {collected.level > 1 && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-[8px] font-bold px-1 rounded-sm text-black">
                    Lvl {collected.level}
                  </div>
                )}
                {isGold && (
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <span className="text-xl font-bold text-muted-foreground/30">??</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
