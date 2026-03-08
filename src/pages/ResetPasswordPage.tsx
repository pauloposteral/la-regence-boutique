import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      navigate("/conta");
    }
  };

  if (!isRecovery) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="font-display text-2xl mb-4">Link inválido ou expirado</p>
          <Button variant="outline" onClick={() => navigate("/auth")}>Voltar ao login</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-8"
        >
          <h1 className="font-display text-2xl font-semibold text-center mb-6">Nova Senha</h1>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label className="font-body text-xs">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 font-body"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <Button type="submit" className="w-full font-body bg-gold text-primary-foreground hover:bg-gold-light rounded-none tracking-wider uppercase" disabled={loading}>
              {loading ? "Aguarde..." : <>Alterar Senha <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
