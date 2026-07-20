import type { Metadata } from "next";
import { AccountClient } from "./account-client";

export const metadata: Metadata = {
  title: "حساب کاربری | ناخدا",
};

// Client-rendered: the profile is fetched in the browser via /api/account/profile.
export default function AccountPage() {
  return <AccountClient />;
}
