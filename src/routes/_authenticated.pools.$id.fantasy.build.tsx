import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFantasyPlayers, upsertFantasyLineup, getPoolById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FantasyPitch } from "@/components/fantasy/FantasyPitch";
import { User, Search, Filter, Info, ChevronRight, ChevronLeft, Check, Star, Shield, Zap, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pools/$id/fantasy/build" as any)({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["fantasyPlayers"], queryFn: () => getFantasyPlayers() }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
    ]);
  },

  component: FantasyBuildComponent,
});

const FORMATIONS: any = {
  '4-4-2': { gk: 1, def: 4, mid: 4, fwd: 2 },
  '4-3-3': { gk: 1, def: 4, mid: 3, fwd: 3 },
  '3-5-2': { gk: 1, def: 3, mid: 5, fwd: 2 },
  '3-4-3': { gk: 1, def: 3, mid: 4, fwd: 3 },
  '4-5-1': { gk: 1, def: 4, mid: 5, fwd: 1 },
  '5-3-2': { gk: 1, def: 5, mid: 3, fwd: 2 },
  '5-4-1': { gk: 1, def: 5, mid: 4, fwd: 1 },
};

function FantasyBuildComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/fantasy/build" as any });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: players } = useSuspenseQuery({ queryKey: ["fantasyPlayers"], queryFn: () => getFantasyPlayers() });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });

  const [formation, setFormation] = useState('4-4-2');
  const [selectedSlots, setSelectedSlots] = useState<Record<string, any>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<string | null>(null);

  const budget = useMemo(() => {
    return Object.values(selectedSlots).reduce((acc, p) => acc + (p?.market_value || 0), 0);
  }, [selectedSlots]);

  const slots = useMemo(() => {
    const f = FORMATIONS[formation];
    const s = [
      { slot: 'gk', player: selectedSlots['gk'], isCaptain: captainId === selectedSlots['gk']?.id, isViceCaptain: viceCaptainId === selectedSlots['gk']?.id },
      ...Array.from({ length: f.def }).map((_, i) => ({ slot: `def${i+1}`, player: selectedSlots[`def${i+1}`], isCaptain: captainId === selectedSlots[`def${i+1}`]?.id, isViceCaptain: viceCaptainId === selectedSlots[`def${i+1}`]?.id })),
      ...Array.from({ length: f.mid }).map((_, i) => ({ slot: `mid${i+1}`, player: selectedSlots[`mid${i+1}`], isCaptain: captainId === selectedSlots[`mid${i+1}`]?.id, isViceCaptain: viceCaptainId === selectedSlots[`mid${i+1}`]?.id })),
      ...Array.from({ length: f.fwd }).map((_, i) => ({ slot: `fwd${i+1}`, player: selectedSlots[`fwd${i+1}`], isCaptain: captainId === selectedSlots[`fwd${i+1}`]?.id, isViceCaptain: viceCaptainId === selectedSlots[`fwd${i+1}`]?.id })),
      { slot: 'bench1', player: selectedSlots['bench1'], isBench: true },
      { slot: 'bench2', player: selectedSlots['bench2'], isBench: true },
      { slot: 'bench3', player: selectedSlots['bench3'], isBench: true },
      { slot: 'bench4', player: selectedSlots['bench4'], isBench: true },
    ];
    return s;
  }, [formation, selectedSlots, captainId, viceCaptainId]);

  const filteredPlayers = useMemo(() => {
    if (!activeSlot) return [];
    const pos = activeSlot.startsWith('gk') ? 'GK' : 
                activeSlot.startsWith('def') ? 'DEF' :
                activeSlot.startsWith('mid') ? 'MID' : 'FWD';
    
    return (players as any[]).filter(p => 
      p.position === pos && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !Object.values(selectedSlots).some(s => s?.id === p.id)
    );
  }, [players, activeSlot, searchTerm, selectedSlots]);

  const handleSelectPlayer = (player: any) => {
    if (budget + player.market_value > 100000000) {
      toast.error("Orçamento insuficiente!");
      return;
    }
    
    // Check max 3 players per team
    const teamCount = Object.values(selectedSlots).filter(s => s?.team_id === player.team_id).length;
    if (teamCount >= 3) {
      toast.error(`Máximo de 3 jogadores por seleção (${player.team.name})`);
      return;
    }

    setSelectedSlots(prev => ({ ...prev, [activeSlot!]: player }));
    setActiveSlot(null);
    setSearchTerm("");
  };

  const upsertMutation = useMutation({
    mutationFn: () => (upsertFantasyLineup as any)({
      data: {
        poolId: id,
        gameweek: 1, // Start at GW 1
        formation,
        players: Object.entries(selectedSlots).map(([slot, p]) => ({
          player_id: p.id,
          slot,
          is_bench: slot.startsWith('bench')
        })),
        captainId,
        viceCaptainId,
        budgetUsed: budget
      }
    }),
    onSuccess: () => {
      toast.success("Time escalado com sucesso!");
      navigate({ to: `/pools/${id}/fantasy` });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const isComplete = slots.every(s => s.player) && captainId && viceCaptainId;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Escalar Time</h1>
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest">Monte sua base para a Gameweek 1</p>
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-muted border-none rounded-full px-4 py-2 text-xs font-black uppercase"
              value={formation}
              onChange={(e) => {
                setFormation(e.target.value);
                setSelectedSlots({});
              }}
            >
              {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="max-w-xl mx-auto">
          <FantasyPitch slots={slots} onSlotClick={setActiveSlot} formation={formation} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase font-black">Orçamento</p>
              <p className="text-xl font-black">${((100000000 - budget) / 1000000).toFixed(1)}M</p>
              <Progress value={(budget / 100000000) * 100} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase font-black">Jogadores</p>
              <p className="text-xl font-black">{Object.values(selectedSlots).length}/15</p>
              <Progress value={(Object.values(selectedSlots).length / 15) * 100} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        <Button 
          className="w-full h-14 text-lg font-black uppercase italic" 
          disabled={!isComplete || upsertMutation.isPending}
          onClick={() => upsertMutation.mutate()}
        >
          {upsertMutation.isPending ? "Salvando..." : "Confirmar Time"}
          <ChevronRight className="ml-2 h-6 w-6" />
        </Button>
      </div>

      <AnimatePresence>
        {activeSlot && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-full md:w-96 bg-card border-l shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-black uppercase italic">Selecionar {activeSlot.toUpperCase()}</h2>
              <Button variant="ghost" size="icon" onClick={() => setActiveSlot(null)}>
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar jogador..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredPlayers.map((player: any) => (
                <Card 
                  key={player.id} 
                  className="hover:border-primary cursor-pointer transition-colors group"
                  onClick={() => handleSelectPlayer(player)}
                >
                  <CardContent className="p-3 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                      <img src={player.photo_url || player.team.flag_url} alt={player.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm leading-none">{player.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{player.team.name} • {player.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">${(player.market_value / 1000000).toFixed(1)}M</p>
                      <p className="text-[8px] text-muted-foreground uppercase font-bold">Valor</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:border-l bg-muted/30 w-full md:w-64 space-y-6">
        <h3 className="font-black uppercase text-xs tracking-widest text-muted-foreground">Capitães</h3>
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
               <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> Capitão (2x pts)
             </label>
             <select 
               className="w-full bg-background border rounded-lg p-2 text-xs"
               value={captainId || ""}
               onChange={(e) => setCaptainId(e.target.value)}
             >
               <option value="">Selecionar...</option>
               {Object.values(selectedSlots).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
               <Star className="h-3 w-3 text-slate-400 fill-slate-400" /> Vice-Capitão
             </label>
             <select 
               className="w-full bg-background border rounded-lg p-2 text-xs"
               value={viceCaptainId || ""}
               onChange={(e) => setViceCaptainId(e.target.value)}
             >
               <option value="">Selecionar...</option>
               {Object.values(selectedSlots).filter(p => p.id !== captainId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
           </div>
        </div>
      </div>
    </div>
  );
}
