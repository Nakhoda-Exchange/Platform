import { SiteShell } from "@/components/layout/site-shell";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";

export default function LandingPage() {
  return (
    <SiteShell>
      <Hero />
      <FeatureGrid />
    </SiteShell>
  );
}
