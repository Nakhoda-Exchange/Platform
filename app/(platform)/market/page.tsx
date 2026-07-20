import type { Metadata } from "next";
import { MarketClient } from "./market-client";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/market/overview.
// See market-client.tsx for the rendering/fetch boundary.
export default function MarketPage() {
  return <MarketClient />;
}
