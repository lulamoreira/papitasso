import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getQuizLeaderboard, getProfile } from "@/lib/api.functions";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/quiz/ranking")({
  component: QuizRankingPage,
});

function QuizRankingPage() {
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  const { data: leaderboard } = useSuspenseQuery({
    queryKey: ["quiz-global-leaderboard"],
    queryFn: () => getQuizLeaderboard({ data: null }),
  });

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <PageHeader title="Ranking do Quiz" backTo="/quiz" />
      
      <div className="space-y-4 pt-4">
        {leaderboard?.map((entry: any) => {
          const isMe = entry.user_id === profile?.id;
          
          return (
            <Card 
              key={entry.user_id} 
              className={`overflow-hidden border-2 transition-all ${
                isMe ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-transparent"
              }`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-muted-foreground">
                  {entry.leaderboard_position}º
                </div>
                
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={entry.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {entry.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate text-base">
                    {entry.name} {isMe && "(Você)"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Target className="w-3 h-3 text-green-500" />
                      <span>{entry.total_correct} acertos</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{entry.streak} dias</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                   <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                     {Math.round((Number(entry.total_correct) / Math.max(Number(entry.total_answered), 1)) * 100)}%
                   </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!leaderboard || leaderboard.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Ninguém respondeu o quiz ainda. Seja o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  );
}