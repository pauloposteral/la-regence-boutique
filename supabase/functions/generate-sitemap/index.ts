import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const baseUrl = "https://lojalaregence.lovable.app";
  const now = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/cafes", priority: "0.9", changefreq: "daily" },
    { loc: "/assinatura", priority: "0.8", changefreq: "monthly" },
    { loc: "/sobre", priority: "0.6", changefreq: "monthly" },
    { loc: "/blog", priority: "0.7", changefreq: "weekly" },
    { loc: "/quiz", priority: "0.5", changefreq: "monthly" },
    { loc: "/contato", priority: "0.5", changefreq: "monthly" },
  ];

  // Products
  const { data: produtos } = await supabase
    .from("produtos")
    .select("slug, updated_at")
    .eq("ativo", true);

  // Blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("publicado", true);

  // Categories
  const { data: categorias } = await supabase
    .from("categorias")
    .select("slug, updated_at")
    .eq("ativo", true);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static
  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  // Products
  for (const p of produtos || []) {
    xml += `
  <url>
    <loc>${baseUrl}/cafe/${p.slug}</loc>
    <lastmod>${p.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  // Blog
  for (const post of posts || []) {
    xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at?.split("T")[0] || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
