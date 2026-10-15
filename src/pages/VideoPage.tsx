import { useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import TVPlayer from "@/components/tv/TVPlayer";
import { useTVVideos } from "@/hooks/useTVVideos";

export default function VideoPage() {
  const [params] = useSearchParams();
  const { data, isLoading, isError, refetch, isFetching } = useTVVideos();
  return <>
    <SEOHead title="TV La Régence" noIndex />
    {isLoading || isError && !data ? (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-brown-deep p-8 text-center text-white">
        <p className="font-display text-4xl text-gold-light">La Régence · TV</p>
        <p role="status">{isLoading ? "Preparando a programação…" : "Não foi possível carregar a programação. Verifique a conexão da TV."}</p>
        {isError && <button className="rounded-full bg-gold px-6 py-3" onClick={() => void refetch()}>Tentar novamente</button>}
      </div>
    ) : <TVPlayer videos={data ?? []} initialId={params.get("iniciar")} onRefresh={async () => { await refetch({throwOnError:true}); }} refreshing={isFetching} />}
  </>;
}
