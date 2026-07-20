import type { Metadata } from "next";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = {
  title: "تاریخچه تراکنش‌ها | ناخدا",
};

// Client-rendered: the filter is read from the URL and data is fetched in the
// browser via /api/wallet/transactions. See history-client.tsx.
export default function HistoryPage() {
  return <HistoryClient />;
}
