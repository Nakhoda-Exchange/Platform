import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClasses } from "@/components/ui/button";
import { SmartphoneIcon } from "@/components/ui/icons";
import { Logo } from "./logo";

/**
 * Site header: logo pinned to the start (right, in RTL) and the platform CTA
 * plus app hint to the end (left). Sticky and translucent on scroll.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Logo size={22} />

        <div className="flex items-center gap-3 text-muted">
          <Link href="#" className={buttonClasses({ size: "sm" })}>
            مشاهده پلتفرم
          </Link>
          <SmartphoneIcon size={20} className="shrink-0" />
        </div>
      </Container>
    </header>
  );
}
