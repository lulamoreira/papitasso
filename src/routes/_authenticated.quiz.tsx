import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getDailyQuiz, submitQuizAnswer, getQuizUserStatus, getProfile } from "@/lib/api.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CheckCircle2, XCircle, Zap, Info } from "lucide-react";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/_authenticated/quiz")({
  component: QuizPage,
});

function QuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useSuspenseQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(undefined),
  });

  const { data: quiz } = useSuspenseQuery({
    queryKey: ["daily-quiz"],
    queryFn: () => getDailyQuiz(),
  });

  const { data: userStatus } = useQuery({
    queryKey: ["quiz-status", quiz?.id],
    queryFn: () => quiz?.id ? getQuizUserStatus({ data: quiz.id }) : Promise.resolve(null),
    enabled: !!quiz?.id,
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: (variables: any) => submitQuizAnswer({ data: variables }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-status"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["daily-quiz"] });
      if (data.is_correct) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#eab308', '#ffffff']
        });
        toast.success("Resposta correta! +10 XP");
      } else {
        toast.error("Resposta incorreta! +5 XP pela participação");
      }
    },
  });

  const handleAnswer = (index: number) => {
    if (userStatus || submitMutation.isPending) return;
    setSelectedOption(index);
    submitMutation.mutate({ 
      quizId: quiz.id, 
      answerIndex: index, 
      isCorrect: index === quiz.correct_index 
    });
  };

  if (!quiz) return <div className="p-8 text-center">Carregando quiz do dia...</div>;

  const isAnswered = !!userStatus;

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-6">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Quiz do Dia
          </h1>
          <p className="text-muted-foreground">Ganhe XP e concorra a prêmios do seu Bolão!</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-primary/10 px-4 py-2 rounded-full flex items-center gap-2 border border-primary/20">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-primary">{profile?.quiz_streak || 0} dias</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-bold text-primary flex items-center gap-1 h-7"
            onClick={() => navigate({ to: "/quiz/ranking" })}
          >
            <Trophy className="w-3 h-3" />
            Ranking do Quiz
          </Button>
        </div>
      </header>


      <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
        <div className="bg-primary p-1">
           <div className="h-1 bg-white/20 w-full" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
              Dificuldade: {quiz.difficulty}
            </span>
            <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <CardTitle className="text-xl leading-tight">{quiz.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quiz.options.map((option: string, index: number) => {
            let variant: "outline" | "default" | "destructive" | "secondary" = "outline";
            let Icon = null;

            if (isAnswered) {
              if (index === quiz.correct_index) {
                variant = "default"; // Correct one
                Icon = <CheckCircle2 className="w-5 h-5 ml-auto" />;
              } else if (index === userStatus.answer_index && !userStatus.is_correct) {
                variant = "destructive";
                Icon = <XCircle className="w-5 h-5 ml-auto" />;
              } else {
                variant = "outline";
              }
            } else if (selectedOption === index) {
              variant = "secondary";
            }

            return (
              <Button
                key={index}
                variant={variant}
                className={`w-full justify-start h-auto py-4 text-left font-medium text-base transition-all duration-300 ${
                   !isAnswered ? "hover:translate-x-1 hover:border-primary" : ""
                } ${index === quiz.correct_index && isAnswered ? "bg-green-600 hover:bg-green-600 text-white" : ""}`}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <span className="flex-1">{option}</span>
                {Icon}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <CardContent className="pt-6 flex gap-4">
                <Info className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">Você sabia?</h4>
                  <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">{quiz.fact}</p>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate({ to: "/" })}
            >
              Voltar para o Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
