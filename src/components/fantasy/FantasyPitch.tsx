import { motion } from "framer-motion";
import { User, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  market_value: number;
  photo_url?: string;
  team: {
    flag_url: string;
    short_name: string;
  };
}

interface PitchSlot {
  slot: string;
  player: Player | null;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

export function FantasyPitch({ 
  slots, 
  onSlotClick, 
  formation = '4-4-2' 
}: { 
  slots: PitchSlot[], 
  onSlotClick?: (slot: string) => void,
  formation?: string 
}) {
  const gk = slots.find(s => s.slot === 'gk');
  const defs = slots.filter(s => s.slot.startsWith('def'));
  const mids = slots.filter(s => s.slot.startsWith('mid'));
  const fwds = slots.filter(s => s.slot.startsWith('fwd'));
  const bench = slots.filter(s => s.slot.startsWith('bench'));

  const renderPlayer = (slotData: PitchSlot) => {
    const { slot, player, isCaptain, isViceCaptain } = slotData;
    return (
      <motion.div 
        key={slot}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSlotClick?.(slot)}
        className="flex flex-col items-center cursor-pointer group"
      >
        <div className="relative">
          <div className={cn(
            "h-12 w-12 rounded-full border-2 flex items-center justify-center overflow-hidden shadow-lg",
            player ? "bg-background border-primary" : "bg-white/10 border-white/20 border-dashed"
          )}>
            {player ? (
              <img src={player.photo_url || player.team?.flag_url} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-white/40" />
            )}
          </div>
          {isCaptain && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm">
              <Star className="h-3 w-3 text-black fill-black" />
            </div>
          )}
          {isViceCaptain && (
            <div className="absolute -top-1 -right-1 bg-slate-300 rounded-full p-0.5 shadow-sm">
              <Star className="h-3 w-3 text-black fill-black" />
            </div>
          )}
        </div>
        <div className="mt-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white max-w-[60px] truncate uppercase tracking-tighter text-center">
          {player ? player.name.split(' ').pop() : "Escolher"}
        </div>
        {player && (
          <div className="text-[7px] text-white/70 font-black">
            {(player.market_value / 1000000).toFixed(1)}M
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-[#009C3B] rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
      {/* Pitch Lines */}
      <div className="absolute inset-4 border-2 border-white/30 pointer-events-none" />
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/30 rounded-full pointer-events-none" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 border-t-0 pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/30 border-b-0 pointer-events-none" />

      {/* Players Grid */}
      <div className="absolute inset-0 flex flex-col justify-around py-8 px-4">
        <div className="flex justify-around">
          {fwds.map(renderPlayer)}
        </div>
        <div className="flex justify-around">
          {mids.map(renderPlayer)}
        </div>
        <div className="flex justify-around">
          {defs.map(renderPlayer)}
        </div>
        <div className="flex justify-around">
          {gk && renderPlayer(gk)}
        </div>
      </div>

      {/* Bench */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/40 backdrop-blur-md flex items-center justify-around px-4 border-t border-white/10">
        <div className="absolute -top-5 left-4 bg-black/60 px-3 py-0.5 rounded-full text-[8px] font-black text-white/50 uppercase tracking-widest">
          Banco de Reservas
        </div>
        {bench.map(renderPlayer)}
      </div>
    </div>
  );
}
