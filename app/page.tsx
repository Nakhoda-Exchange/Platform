import { SiteShell } from "@/components/layout/site-shell";
import { Hero } from "@/components/landing/hero";
import { MarketTicker } from "@/components/landing/market-ticker";
import { WhyNakhoda } from "@/components/landing/why-nakhoda";
import { AboardBand } from "@/components/landing/aboard-band";

export default function LandingPage() {
  return (
    <SiteShell>
      <Hero />
      <MarketTicker />
      <WhyNakhoda />
      <AboardBand />
    </SiteShell>
  );
}
