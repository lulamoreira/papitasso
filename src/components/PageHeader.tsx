import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  backTo?: string;
  backToParams?: any;
  rightElement?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  backTo, 
  backToParams,
  rightElement, 
  className 
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md", className)}>
      <div className="container mx-auto flex h-16 items-center px-4 gap-4">
        {backTo && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="-ml-2"
            onClick={() => navigate({ to: backTo as any, params: backToParams })}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        <h1 className="flex-1 text-lg font-bold truncate leading-tight">{title}</h1>
        {rightElement && (
          <div className="flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
}

