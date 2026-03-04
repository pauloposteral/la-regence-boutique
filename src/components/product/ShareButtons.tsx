import { Share2, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  url: string;
  title: string;
}

const ShareButtons = ({ url, title }: Props) => {
  const fullUrl = `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    toast.success("Link copiado!");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-body text-muted-foreground mr-1">Compartilhar:</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, "_blank")}
        aria-label="Compartilhar no WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink} aria-label="Copiar link">
        <Copy className="w-4 h-4" />
      </Button>
      {navigator.share && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigator.share({ title, url: fullUrl })}
          aria-label="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default ShareButtons;
