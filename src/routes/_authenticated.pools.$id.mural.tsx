import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMuralPosts, createMuralPost, deleteMuralPost, getProfile } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Trash2, Megaphone, Trophy, MessageSquare, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pools/$id/mural")({
  loader: async ({ params, context }: any) => {
    await context.queryClient.ensureQueryData({ 
      queryKey: ["mural", params.id], 
      queryFn: () => getMuralPosts({ data: params.id } as any) 
    });
  },
  component: MuralComponent,
});

function MuralComponent() {
  const { id } = useParams({ strict: false }) as any;
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: posts } = useSuspenseQuery({ 
    queryKey: ["mural", id], 
    queryFn: () => getMuralPosts({ data: id } as any) 
  });
  
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });

  const createMutation = useMutation({
    mutationFn: (text: string) => createMuralPost({ data: { poolId: id, content: text } } as any),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["mural", id] });
      toast.success("Postado no mural!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => deleteMuralPost({ data: postId } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mural", id] });
      toast.success("Post removido.");
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel(`mural-${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'mural_posts',
        filter: `pool_id=eq.${id}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["mural", id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'auto_zoeira': return <Flame className="h-5 w-5 text-orange-500" />;
      case 'match_recap': return <Trophy className="h-5 w-5 text-yellow-500" />;
      default: return <MessageSquare className="h-5 w-5 text-primary" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate(content);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24">
      <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Input
                placeholder="O que tá rolando na torcida? Manda a zoeira..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-muted/30 border-none h-12 focus-visible:ring-primary"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!content.trim() || createMutation.isPending}>
                  Postar no Mural
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {posts?.map((post: any) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={cn(
                "overflow-hidden border-l-4",
                post.type === 'auto_zoeira' ? "border-l-orange-500 bg-orange-500/[0.02]" : 
                post.type === 'match_recap' ? "border-l-yellow-500 bg-yellow-500/[0.02]" : "border-l-primary"
              )}>
                <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted/50">
                      {getPostIcon(post.type)}
                    </div>
                    <div>
                      {post.type === 'auto_zoeira' ? (
                        <span className="font-black text-xs uppercase tracking-widest text-orange-600">Zoeira do VAR 📺</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{post.user?.name || "Sistema"}</span>
                          {post.target_user && (
                            <>
                              <span className="text-xs text-muted-foreground">para</span>
                              <span className="font-bold text-sm">@{post.target_user.name}</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {(post.user_id === profile?.id) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className={cn(
                    "text-lg",
                    post.type === 'auto_zoeira' ? "font-black italic text-orange-700" : "text-foreground"
                  )}>
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {posts?.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <Megaphone className="h-20 w-20 mx-auto mb-4" />
            <p className="font-black text-xl">O mural está vazio...</p>
            <p className="text-sm">Seja o primeiro a mandar um salve!</p>
          </div>
        )}
      </div>
    </div>
  );
}
