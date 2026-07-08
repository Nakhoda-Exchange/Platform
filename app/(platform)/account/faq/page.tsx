import type { Metadata } from "next";
import { FaqScreen } from "@/components/account/faq-screen";

export const metadata: Metadata = {
  title: "سوالات متداول | ناخدا",
};

export default function FaqPage() {
  return <FaqScreen />;
}
