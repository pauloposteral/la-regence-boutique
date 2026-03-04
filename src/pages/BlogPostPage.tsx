import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";

const BlogPostPage = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("publicado", true)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Layout>
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao blog
          </Link>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-64 bg-muted rounded" />
            </div>
          ) : !post ? (
            <p className="font-body text-muted-foreground text-center py-20">Artigo não encontrado.</p>
          ) : (
            <article>
              {post.imagem_url && (
                <div className="aspect-video rounded-lg overflow-hidden mb-8">
                  <img src={post.imagem_url} alt={post.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-body text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
              {post.tags?.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="text-xs font-body bg-accent/10 text-accent px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-6">{post.titulo}</h1>
              {post.resumo && <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">{post.resumo}</p>}
              <div className="prose prose-sm max-w-none font-body text-foreground leading-relaxed whitespace-pre-wrap">
                {post.conteudo}
              </div>
            </article>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BlogPostPage;
