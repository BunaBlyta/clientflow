import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * The public surface is a single page — the marketing site's sections
 * (`#packages`, `#how-it-works`, `#contact`) are anchors on it, not routes, so
 * they are deliberately not listed as separate URLs. Add entries here if the
 * marketing site ever grows real pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
