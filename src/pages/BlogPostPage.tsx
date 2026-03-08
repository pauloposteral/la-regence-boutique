import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";
import DOMPurify from "dompurify";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const BlogPostPage = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug!).eq("publicado", true).maybeSingle();
      return data;
    },
  });

  // Simple markdown-like rendering (bold, italic, headings, lists)
  const renderContent = (content: string) => {
    const sanitized = DOMPurify.sanitize(content);
    return sanitized;
  };

  return (
    <Layout>
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/blog">Blog</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{post?.titulo || "Artigo"}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

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
                  <img src={post.imagem_url} alt={post.titulo} className="w-full h-full object-cover" loading="lazy" />
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
                    <span key={tag} className="text-xs font-body bg-gold/10 text-gold px-2.5 py-1 rounded-sm">{tag}</span>
                  ))}
                </div>
              )}
              <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-6">{post.titulo}</h1>
              {post.resumo && <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">{post.resumo}</p>}
              <div
                className="prose prose-sm max-w-none font-body text-foreground leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderContent(post.conteudo || "") }}
              />
            </article>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BlogPostPage;
