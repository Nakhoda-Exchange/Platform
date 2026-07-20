import type { Metadata } from "next";
import { DepositClient } from "./deposit-client";

export const metadata: Metadata = {
  title: "واریز | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/wallet/deposit.
export default function DepositPage() {
  return <DepositClient />;
}
