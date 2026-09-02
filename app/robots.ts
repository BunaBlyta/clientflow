import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Only the marketing site is public. Everything behind auth — the staff
 * dashboard, the auth screens, the Stripe return pages, and the API the mobile
 * app talks to — is kept out of the index. Those routes already redirect or
 * return 401, this just stops crawlers from spending budget on them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/login", "/accept-invite", "/payment/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
