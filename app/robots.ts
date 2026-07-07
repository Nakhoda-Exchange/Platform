import type { MetadataRoute } from "next";

// Demo site — keep it out of every search index and bot crawl.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
