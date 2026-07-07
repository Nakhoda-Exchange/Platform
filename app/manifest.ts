import type { MetadataRoute } from "next";

// Web app manifest → makes Nakhoda installable. Next serves this at
// /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ناخدا — معامله آلت‌کوین",
    short_name: "ناخدا",
    description: "پلتفرم معامله آلت‌کوین‌ها، ساده و امن.",
    // Always open the installed app on the market screen.
    start_url: "/market",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "fa",
    // Brand background so the native splash matches the in-app splash.
    background_color: "#0023fb",
    theme_color: "#0023fb",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
