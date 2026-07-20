import type { Metadata } from "next";
import { WithdrawClient } from "./withdraw-client";

export const metadata: Metadata = {
  title: "برداشت | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/wallet/withdraw.
export default function WithdrawPage() {
  return <WithdrawClient />;
}
