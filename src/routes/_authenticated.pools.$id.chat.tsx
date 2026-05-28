import { createFileRoute, useParams } from "@tanstack/react-router";
import { PoolChat } from "@/components/PoolChat";

export const Route = createFileRoute("/_authenticated/pools/$id/chat")({
  component: PoolChatRoute,
});

function PoolChatRoute() {
  const { id } = useParams({ strict: false }) as any;
  
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] container mx-auto p-4">
      <PoolChat poolId={id} className="flex-1 shadow-2xl" />
    </div>
  );
}
