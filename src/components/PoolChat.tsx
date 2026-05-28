import { useState, useEffect, useRef } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatMessages, sendChatMessage, toggleReaction, getProfile, getTeams } from "@/lib/api.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Send, Smile, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatProps {
  poolId: string;
  matchId?: string;
  className?: string;
}

export function PoolChat({ poolId, matchId, className }: ChatProps) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showStickers, setShowStickers] = useState(false);

  const { data: messages } = useSuspenseQuery({
    queryKey: ["chat", poolId, matchId],
    queryFn: () => getChatMessages({ data: { poolId, matchId } } as any)
  });
  
  const { data: profile } = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const { data: teams } = useSuspenseQuery({ queryKey: ["teams"], queryFn: () => getTeams() });

  const sendMutation = useMutation({
    mutationFn: (text: string) => sendChatMessage({ data: { poolId, matchId, text } } as any),
    onSuccess: (newMessage) => {
      setMessageText("");
      // Optimistic update already handled by Realtime, but we can update cache locally too
      queryClient.setQueryData(["chat", poolId, matchId], (old: any) => {
        if (!old) return [newMessage];
        // Ensure no duplicates if Realtime is very fast
        if (old.some((m: any) => m.id === newMessage.id)) return old;
        return [...old, newMessage];
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar mensagem");
    }
  });

  const reactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string, emoji: string }) => 
      toggleReaction({ data: { messageId, emoji } } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", poolId, matchId] });
    }
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${poolId}-${matchId || 'general'}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `pool_id=eq.${poolId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["chat", poolId, matchId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poolId, matchId, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText);
  };

  const emojis = ["⚽", "🔥", "😱", "😂", "💀", "🤡", "🎉", "👏"];

  const handleSticker = (team: any) => {
    sendMutation.mutate(`STICKER:${team.flag_url}`);
    setShowStickers(false);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border rounded-xl overflow-hidden", className)}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages?.map((msg: any) => {
            const isMe = msg.user_id === profile?.id;
            const isSticker = msg.text.startsWith("STICKER:");
            const stickerUrl = isSticker ? msg.text.replace("STICKER:", "") : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-start gap-2", isMe ? "flex-row-reverse" : "flex-row")}
              >
                {!isMe && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={msg.user?.avatar_url} />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                  {!isMe && <span className="text-[10px] font-bold text-muted-foreground ml-1">{msg.user?.name}</span>}
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className={cn(
                        "p-3 text-sm rounded-2xl relative group cursor-pointer",
                        isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none",
                        isSticker ? "bg-transparent p-0" : ""
                      )}>
                        {isSticker ? (
                          <img src={stickerUrl!} alt="sticker" className="h-32 w-48 object-cover rounded-lg shadow-lg border-4 border-white" />
                        ) : (
                          msg.text
                        )}
                        
                        <div className={cn(
                          "flex flex-wrap gap-1 mt-1",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          {Object.entries(msg.reactions || {}).map(([emoji, users]: [string, any]) => (
                            users.length > 0 && (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reactionMutation.mutate({ messageId: msg.id, emoji });
                                }}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1",
                                  users.includes(profile?.id) ? "bg-primary/20 border border-primary/30" : "bg-background/50 border"
                                )}
                              >
                                {emoji} {users.length}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-1 flex gap-1" side="top">
                      {emojis.map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-lg"
                          onClick={() => reactionMutation.mutate({ messageId: msg.id, emoji })}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <span className="text-[9px] text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-muted/20">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <Popover open={showStickers} onOpenChange={setShowStickers}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" side="top">
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {teams?.map((team: any) => (
                  <button
                    key={team.id}
                    onClick={() => handleSticker(team)}
                    className="hover:scale-110 transition-transform"
                  >
                    <img src={team.flag_url} className="h-10 w-15 object-cover rounded shadow-sm" alt={team.name} />
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 bg-background"
          />
          <Button type="submit" size="icon" disabled={!messageText.trim() || sendMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
