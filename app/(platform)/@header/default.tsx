import { PlatformHeader } from "@/components/layout/platform-header";

/** Hard-load fallback for routes without a page-specific header. */
export default function DefaultHeader() {
  return <PlatformHeader />;
}
