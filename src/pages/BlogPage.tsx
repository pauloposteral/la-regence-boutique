import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const POSTS_PER_PAGE = 9;

const BlogPage = () => {
  const [page, setPage] = useState(1);
  const { data: posts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("publicado", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => posts.slice(0, page * POSTS_PER_PAGE), [posts, page]);

  return (
    <Layout>
      <SEOHead title="Blog" description="Dicas de preparo, curiosidades sobre café e receitas exclusivas da La Régence." />
      {/* Hero */}
      <section className="bg-background border-b border-border py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <span className="text-gold text-xs font-body tracking-[0.3em] uppercase">Blog</span>
          <h1 className="font-display text-3xl lg:text-5xl font-light mt-3 text-foreground">
            Histórias & <span className="italic font-medium text-gradient-gold">Sabores</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-4 max-w-lg mx-auto">
            Dicas de preparo, curiosidades sobre café e receitas exclusivas da La Régence.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Blog</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {posts.length === 0 ? (
            <p className="text-center font-body text-muted-foreground">Nenhum artigo publicado ainda.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post: any, i: number) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % POSTS_PER_PAGE) * 0.05 }}
                  >
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="aspect-[16/10] rounded-lg overflow-hidden bg-secondary mb-4">
                        {post.imagem_url ? (
                          <img src={post.imagem_url} alt={post.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="font-body text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      </div>
                      {post.tags?.length > 0 && (
                        <div className="flex gap-1.5 mb-2">
                          {post.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-body bg-gold/10 text-gold px-2 py-0.5 rounded-sm border border-gold/20">{tag}</span>
                          ))}
                        </div>
                      )}
                      <h2 className="font-display text-lg font-semibold group-hover:text-gold transition-colors duration-300 mb-1">{post.titulo}</h2>
                      {post.resumo && <p className="font-body text-sm text-muted-foreground line-clamp-2">{post.resumo}</p>}
                      <span className="inline-flex items-center gap-1 font-body text-xs text-gold font-medium mt-3 group-hover:gap-2 transition-all">
                        Ler mais <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </motion.article>
                ))}
              </div>
              {page < totalPages && (
                <div className="text-center mt-10">
                  <Button variant="outline" className="font-body text-sm px-8" onClick={() => setPage((p) => p + 1)}>
                    Carregar mais artigos ({posts.length - paginatedPosts.length} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BlogPage;
