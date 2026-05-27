import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Download, Link as LinkIcon, MessageCircle, Loader2 } from "lucide-react";
import { generateShareCard } from "@/lib/api.functions";
import { toast } from "sonner";

interface ShareModalProps {
  title: string;
  description: string;
  colors?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ title, description, colors = "#16a34a", isOpen, onClose }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardData, setCardData] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await (generateShareCard as any)({ data: { title, description, colors } });
      setCardData(res);
    } catch (err) {
      toast.error("Erro ao gerar card de compartilhamento");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareWhatsApp = () => {
    const text = `Olha só o que eu conquistei no GolPalpite! 🏆\n\n${title}: ${description}\n\nConfira meu desempenho: ${cardData?.url || window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(cardData?.url || window.location.href);
    toast.success("Link copiado!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Conquista</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {!cardData ? (
            <div className="text-center space-y-4">
               <div className="p-4 bg-primary/10 rounded-full mx-auto w-16 h-16 flex items-center justify-center">
                 <Share2 className="w-8 h-8 text-primary" />
               </div>
               <p className="text-sm text-muted-foreground">Gerar um card personalizado para compartilhar com seus amigos?</p>
               <Button onClick={handleGenerate} disabled={isGenerating}>
                 {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gerar Card com IA"}
               </Button>
            </div>
          ) : (
            <>
              <div 
                className="w-64 h-96 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white"
                style={{ background: cardData.design.bg_gradient || `linear-gradient(135deg, ${colors}, #000)` }}
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Share2 className="w-32 h-32" />
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    GolPalpite 2026
                  </div>
                  <h2 className="text-3xl font-black leading-tight tracking-tighter uppercase">{cardData.design.title}</h2>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <p className="text-sm font-medium leading-relaxed opacity-90">{cardData.design.description}</p>
                  <div className="pt-4 border-t border-white/20">
                     <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Slogan da Rodada</p>
                     <p className="text-xs font-bold italic">"{cardData.design.slogan}"</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <Button variant="outline" className="gap-2" onClick={shareWhatsApp}>
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="gap-2" onClick={copyLink}>
                  <LinkIcon className="w-4 h-4" />
                  Link
                </Button>
                <Button variant="outline" className="gap-2 col-span-2" onClick={() => window.open(cardData.url, '_blank')}>
                  <Download className="w-4 h-4" />
                  Baixar Imagem
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
