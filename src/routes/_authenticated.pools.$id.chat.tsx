import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { PoolChat } from "@/components/PoolChat";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pools/$id/chat")({
  component: PoolChatRoute,
});

function PoolChatRoute() {
  const { id } = useParams({ strict: false }) as any;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader title="Chat" backTo="/pools/$id" backToParams={{ id }} />
      <div className="flex-1 container mx-auto p-4 overflow-hidden">
        <PoolChat poolId={id} className="flex-1 shadow-2xl" />
      </div>
    </div>
  );

}

