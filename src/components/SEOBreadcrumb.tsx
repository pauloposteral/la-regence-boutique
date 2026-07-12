import { Helmet } from "react-helmet-async";

interface Crumb {
  name: string;
  url: string;
}

/** Injeta BreadcrumbList JSON-LD para SEO (rich results do Google). */
const SEOBreadcrumb = ({ items }: { items: Crumb[] }) => {
  if (!items.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default SEOBreadcrumb;
