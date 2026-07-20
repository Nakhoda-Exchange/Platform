import type { Metadata } from "next";
import { ReferralClient } from "./referral-client";

export const metadata: Metadata = {
  title: "کد دعوت | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/account/referral.
export default function ReferralPage() {
  return <ReferralClient />;
}
