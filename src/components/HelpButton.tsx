import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface HelpButtonProps {
  title: string;
  description: string;
  idealFor: string;
}

export function HelpButton({ title, description, idealFor }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 rounded-full p-0 text-muted-foreground hover:text-primary"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <section>
            <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              O que é?
            </h4>
            <p className="text-balance leading-relaxed">{description}</p>
          </section>
          <Card className="border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary">
              Bom pra quem?
            </h4>
            <p className="text-balance text-sm font-medium">{idealFor}</p>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="w-full">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
