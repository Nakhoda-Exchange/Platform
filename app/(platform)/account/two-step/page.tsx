import type { Metadata } from "next";
import { TwoStepClient } from "./two-step-client";

export const metadata: Metadata = {
  title: "ورود دومرحله‌ای | ناخدا",
};

// Client-rendered: the profile (2FA flag) is fetched in the browser via
// /api/account/profile.
export default function TwoStepPage() {
  return <TwoStepClient />;
}
