import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!authLoading && user) navigate("/conta");
  }, [user, authLoading, navigate]);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
    } else {
      toast.success("Bem-vindo de volta! ☕");
      navigate("/conta");
    }
  };

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      setMode("login");
    }
  };

  const handleForgot = async () => {
    if (!form.email) {
      toast.error("Informe seu e-mail");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado!");
      setMode("login");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") handleLogin();
    else if (mode === "signup") handleSignup();
    else handleForgot();
  };

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-16">
        {/* Subtle texture bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.3'%3E%3Cellipse cx='20' cy='20' rx='6' ry='9' transform='rotate(30 20 20)'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-card border border-border rounded-lg p-8 w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/images/logo-laregence.jpeg" 
              alt="La Régence" 
              className="w-16 h-16 rounded-xl object-cover mx-auto mb-3 border border-gold/20 shadow-md" 
            />
            <h1 className="font-display text-3xl font-semibold">
              La <span className="text-gradient-gold italic">Régence</span>
            </h1>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {mode === "login" && "Entre na sua conta"}
              {mode === "signup" && "Crie sua conta"}
              {mode === "forgot" && "Recuperar senha"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label className="font-body text-xs">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="pl-10 font-body"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="font-body text-xs">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-10 font-body"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <Label className="font-body text-xs">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="pl-10 pr-10 font-body"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-body text-accent hover:underline"
              >
                Esqueceu a senha?
              </button>
            )}

            <Button type="submit" className="w-full font-body" disabled={loading}>
              {loading ? "Aguarde..." : (
                <>
                  {mode === "login" && "Entrar"}
                  {mode === "signup" && "Criar conta"}
                  {mode === "forgot" && "Enviar e-mail"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {mode === "login" && (
              <p className="font-body text-sm text-muted-foreground">
                Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-accent hover:underline font-medium">
                  Cadastre-se
                </button>
              </p>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <p className="font-body text-sm text-muted-foreground">
                Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="text-accent hover:underline font-medium">
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AuthPage;
