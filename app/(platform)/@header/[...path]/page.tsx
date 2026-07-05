import { PlatformHeader } from "@/components/layout/platform-header";

/**
 * Catch-all header: matches every platform route that doesn't define its own
 * `@header` page, so the slot follows soft navigations too (an unmatched
 * parallel slot would otherwise keep the previous page's header on
 * client-side transitions). More specific slot pages (e.g. market/[symbol])
 * win over this one.
 */
export default function CatchAllHeader() {
  return <PlatformHeader />;
}
