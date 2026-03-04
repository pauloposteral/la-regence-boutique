import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  produtoId: string;
}

const FavoriteButton = ({ produtoId }: Props) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("favoritos")
      .select("id")
      .eq("user_id", user.id)
      .eq("produto_id", produtoId)
      .maybeSingle()
      .then(({ data }) => setIsFav(!!data));
  }, [user, produtoId]);

  const toggle = async () => {
    if (!user) { toast.error("Faça login para favoritar"); return; }
    setLoading(true);
    if (isFav) {
      await supabase.from("favoritos").delete().eq("user_id", user.id).eq("produto_id", produtoId);
      setIsFav(false);
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("favoritos").insert({ user_id: user.id, produto_id: produtoId });
      setIsFav(true);
      toast.success("Adicionado aos favoritos ♡");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0"
      aria-label="Favoritar"
      onClick={toggle}
      disabled={loading}
    >
      <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-destructive text-destructive" : ""}`} />
    </Button>
  );
};

export default FavoriteButton;
