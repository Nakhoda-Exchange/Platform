import type { Metadata } from "next";
import { WalletClient } from "./wallet-client";

export const metadata: Metadata = {
  title: "دارایی | ناخدا",
};

// Client-rendered: the portfolio is fetched in the browser via
// /api/wallet/portfolio. See wallet-client.tsx for the fetch boundary.
export default function WalletPage() {
  return <WalletClient />;
}
