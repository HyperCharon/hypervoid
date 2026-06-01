import type { MetadataRoute } from "next";
import { getAllPostMeta, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/lib/site-config";

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/posts", priority: 0.9, changeFrequency: "daily" },
  { path: "/archive", priority: 0.7, changeFrequency: "weekly" },
  { path: "/tags", priority: 0.8, changeFrequency: "weekly" },
  { path: "/series", priority: 0.7, changeFrequency: "weekly" },
  { path: "/pinned", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/anime", priority: 0.6, changeFrequency: "weekly" },
  { path: "/movies", priority: 0.6, changeFrequency: "weekly" },
  { path: "/books", priority: 0.6, changeFrequency: "weekly" },
  { path: "/games", priority: 0.6, changeFrequency: "weekly" },
  { path: "/music", priority: 0.5, changeFrequency: "monthly" },
  { path: "/projects", priority: 0.6, changeFrequency: "monthly" },
  { path: "/skills", priority: 0.6, changeFrequency: "monthly" },
  { path: "/timeline", priority: 0.6, changeFrequency: "monthly" },
  { path: "/albums", priority: 0.5, changeFrequency: "monthly" },
  { path: "/diary", priority: 0.5, changeFrequency: "weekly" },
  { path: "/friends", priority: 0.4, changeFrequency: "monthly" },
  { path: "/guestbook", priority: 0.4, changeFrequency: "weekly" },
  { path: "/resources", priority: 0.5, changeFrequency: "weekly" },
  { path: "/year-in-review", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [allPosts, allTags] = await Promise.all([
    getAllPostMeta(),
    getAllTags(),
  ]);

  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  const postUrls: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${siteConfig.url}/posts/${post.slug}`,
    // Prefer updatedDate so Google sees real edits without bumping create dates.
    lastModified: post.frontmatter.updatedDate
      ? new Date(post.frontmatter.updatedDate)
      : post.frontmatter.date
        ? new Date(post.frontmatter.date)
        : now,
    changeFrequency: "monthly",
    priority: post.frontmatter.pinned ? 0.9 : 0.8,
  }));

  const tagUrls: MetadataRoute.Sitemap = allTags.map(({ tag }) => ({
    url: `${siteConfig.url}/tags/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // Year-in-review pages — only emit years that have at least one post.
  const yearSet = new Set<number>();
  for (const p of allPosts) {
    const d = p.frontmatter.date;
    if (!d) continue;
    yearSet.add(new Date(d).getFullYear());
  }
  const yearUrls: MetadataRoute.Sitemap = [...yearSet].map((y) => ({
    url: `${siteConfig.url}/year-in-review/${y}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.4,
  }));

  return [...staticUrls, ...postUrls, ...tagUrls, ...yearUrls];
}
