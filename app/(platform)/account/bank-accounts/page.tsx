import type { Metadata } from "next";
import { BankAccountsClient } from "./bank-accounts-client";

export const metadata: Metadata = {
  title: "حساب‌های بانکی | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/account/bank-accounts.
export default function BankAccountsPage() {
  return <BankAccountsClient />;
}
