import { Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import VideoManager from "@/components/tv/VideoManager";

export default function VideoUploadPage() {
  const { user, loading } = useAuth();
  const permission = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !loading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return !!data;
    },
  });
  if (!loading && !user) return <Navigate to="/auth?next=%2Fvideo%2Fenviar" replace />;
  return <>
    <SEOHead title="Gerenciar TV" noIndex />
    {loading || permission.isLoading ? <div className="flex min-h-screen items-center justify-center"><p role="status">Verificando acesso…</p></div> : permission.data ? <VideoManager /> : <div className="mx-auto max-w-lg px-6 py-24 text-center"><h1 className="text-3xl">Acesso administrativo</h1><p className="my-5 text-muted-foreground">{permission.isError ? "Não foi possível verificar o acesso. Tente novamente." : "O envio de vídeos é reservado aos administradores da La Régence."}</p>{permission.isError && <button className="mr-4 rounded-full bg-gold px-5 py-3 text-white" onClick={() => void permission.refetch()}>Tentar novamente</button>}<Link to="/" className="text-gold underline">Voltar à loja</Link></div>}
  </>;
}
