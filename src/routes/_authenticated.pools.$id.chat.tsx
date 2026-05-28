import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { PoolChat } from "@/components/PoolChat";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pools/$id/chat")({
  component: PoolChatRoute,
});

function PoolChatRoute() {
  const { id } = useParams({ strict: false }) as any;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] container mx-auto p-4">
      <header className="flex items-center gap-2 pb-3 mb-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => navigate({ to: "/pools/$id", params: { id } })}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao Bolão
        </Button>
        <h1 className="text-lg font-bold ml-auto">Chat</h1>
      </header>
      <PoolChat poolId={id} className="flex-1 shadow-2xl" />
    </div>
  );
}

