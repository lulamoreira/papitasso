import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getFantasyRanking, getPoolById } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Trophy, Medal, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/pools/$id/fantasy/ranking")({
  loader: async ({ params, context }: any) => {
    await Promise.all([
      context.queryClient.ensureQueryData({ queryKey: ["fantasyRanking", params.id], queryFn: () => getFantasyRanking({ data: params.id } as any) }),
      context.queryClient.ensureQueryData({ queryKey: ["pool", params.id], queryFn: () => getPoolById({ data: params.id } as any) }),
    ]);
  },
  component: FantasyRankingComponent,
});

function FantasyRankingComponent() {
  const { id } = useParams({ from: "/_authenticated/pools/$id/fantasy/ranking" as any });
  const navigate = useNavigate();
  
  const { data: ranking } = useSuspenseQuery({ queryKey: ["fantasyRanking", id], queryFn: () => getFantasyRanking({ data: id } as any) });
  const { data: pool } = useSuspenseQuery({ queryKey: ["pool", id], queryFn: () => getPoolById({ data: id } as any) });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate({ to: "/pools/$id/fantasy", params: { id } })}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao Fantasy
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ranking Fantasy</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
              {pool.name}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-lg mx-auto p-4 space-y-6">
        <div className="flex justify-center gap-4 py-8">
           {ranking.slice(0, 3).map((player: any, i: number) => (
             <div key={player.profile.id} className="flex flex-col items-center gap-2 first:scale-110">
               <div className="relative">
                 <Avatar className="h-16 w-16 border-4 border-primary">
                   <AvatarImage src={player.profile.avatar_url} />
                   <AvatarFallback>{player.profile.name?.[0]}</AvatarFallback>
                 </Avatar>
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                   {i + 1}º
                 </div>
               </div>
               <p className="text-[10px] font-black uppercase max-w-[60px] truncate text-center leading-tight">
                 {player.profile.name}
               </p>
               <p className="text-sm font-black italic">{player.total_points} pts</p>
             </div>
           ))}
        </div>

        <div className="space-y-3">
          {ranking.map((player: any, index: number) => (
            <Card key={player.profile.id} className="border-none bg-muted/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black italic text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={player.profile.avatar_url} />
                    <AvatarFallback>{player.profile.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm">{player.profile.name}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Escalação Ativa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black italic">{player.total_points}</p>
                  <p className="text-[8px] font-black uppercase text-muted-foreground">Pontos</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
