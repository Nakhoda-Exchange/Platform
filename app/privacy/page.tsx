import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { Container } from "@/components/ui/container";
import { LegalContent } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "حریم خصوصی | ناخدا",
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <Container className="py-8">
        <h1 className="px-4 text-[28px] font-extrabold text-ink">حریم خصوصی</h1>
        <LegalContent only="privacy" />
      </Container>
    </SiteShell>
  );
}
