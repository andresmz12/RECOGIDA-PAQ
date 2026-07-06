import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/mi-cuenta",
        "/setup",
        "/etiqueta/",
        "/guia/",
        "/rastreo/",
        "/reset-password/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
