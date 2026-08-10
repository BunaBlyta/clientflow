import type { Package } from "@/lib/types";

export const packages: Package[] = [
  {
    id: "pkg_landing",
    slug: "landing-page",
    name: "Landing Page",
    tagline: "A single, sharp page built to convert.",
    priceUsd: 1200,
    isCustom: false,
    features: [
      "One responsive page, designed from scratch",
      "Copy structure & CMS-free content editing",
      "Deployed on your domain",
      "2 rounds of revisions",
    ],
    turnaroundWeeks: [1, 2],
  },
  {
    id: "pkg_website",
    slug: "full-website",
    name: "Full Website",
    tagline: "A complete multi-page site for your business.",
    priceUsd: 4500,
    isCustom: false,
    isMostPopular: true,
    features: [
      "Up to 8 pages, fully responsive",
      "CMS for self-serve content updates",
      "SEO fundamentals & analytics wired up",
      "3 rounds of revisions",
    ],
    turnaroundWeeks: [3, 5],
  },
  {
    id: "pkg_webapp",
    slug: "web-app-build",
    name: "Web App Build",
    tagline: "Custom software, scoped to what you actually need.",
    priceUsd: null,
    isCustom: true,
    features: [
      "Custom-scoped after a discovery call",
      "Full-stack build: auth, database, integrations",
      "Ongoing collaboration through delivery",
      "Fixed quote before any work starts",
    ],
    turnaroundWeeks: [4, 12],
  },
];
