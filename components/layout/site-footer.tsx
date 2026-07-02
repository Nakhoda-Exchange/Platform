import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

const LINKS = [
  { href: "#", label: "قوانین" },
  { href: "#", label: "حریم خصوصی" },
  { href: "#", label: "پشتیبانی" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-line bg-surface">
      <Container className="flex flex-col items-center gap-6 py-8 text-muted sm:flex-row sm:justify-between">
        {/* start (right) — copyright + wordmark */}
        <div className="flex items-center gap-6 order-2 sm:order-1">
          <p className="text-[14px]">© تمامی حقوق محفوظ است.</p>
          <Logo size={18} href={null} />
        </div>

        {/* end (left) — links */}
        <nav className="flex items-center gap-6 order-1 sm:order-2">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[14px] transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
