import { siteConfig } from "@/lib/site-config";

type ArticleSchemaProps = {
  url: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName: string;
  authorUrl: string;
  tags: string[];
};

/**
 * Embed schema.org Article JSON-LD so Google can render rich snippets
 * (publish date, author, headline, hero image) in search results.
 * Generated server-side; the script tag is harmless on the client.
 */
export function ArticleJsonLd(props: ArticleSchemaProps) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": props.url,
    },
    headline: props.title,
    description: props.description ?? undefined,
    image: props.cover ? [props.cover] : undefined,
    datePublished: props.publishedAt ?? undefined,
    dateModified: props.updatedAt ?? props.publishedAt ?? undefined,
    author: {
      "@type": "Person",
      name: props.authorName,
      url: props.authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    keywords: props.tags.length > 0 ? props.tags.join(", ") : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/<\//g, "<\\//") }}
    />
  );
}
