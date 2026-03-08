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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/conta` },
    });
    if (error) toast.error(error.message);
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

          {mode !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground font-body">ou continue com</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full font-body gap-2" onClick={handleGoogleLogin}>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
            </>
          )}

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
