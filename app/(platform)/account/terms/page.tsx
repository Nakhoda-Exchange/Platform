import type { Metadata } from "next";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "قوانین و حریم خصوصی | ناخدا",
};

export default function TermsPage() {
  return <LegalContent />;
}
