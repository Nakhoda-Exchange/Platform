import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FeatureCard } from "./feature-card";
import { FEATURES } from "./features";

export function FeatureGrid() {
  return (
    <Section>
      <Container>
        {/* LTR flow matches the Figma left-to-right card order; each card stays
            RTL internally so the icon sits top-right and text aligns right. */}
        <div
          dir="ltr"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
