import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "O'Globo Cargo",
    short_name: "O'Globo",
    description:
      "Request international package pickups and track them in real time.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1b2e",
    theme_color: "#0c1b2e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
