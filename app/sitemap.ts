import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/recoger`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/registro`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
