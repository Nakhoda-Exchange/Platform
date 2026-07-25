import Link from "next/link";
import type { AnnouncementAction } from "@/lib/core/domain/account/announcement";
import { buttonClasses } from "@/components/ui/button";
import { isSafeUrl } from "@/lib/utils/safe-markdown";

/**
 * Resolves the backend→frontend action contract: internal actions navigate
 * in-app, external ones open a new tab. An unrecognized type renders NOTHING
 * (forward compatibility — the backend can ship new types without breaking
 * older clients).
 *
 * Both URLs are VALIDATED before they reach an `href` (issue #67). The backend
 * accepts them as bare strings, so without this a `javascript:` action URL would
 * execute on tap in the reader's authenticated session, and an absolute
 * `internal` href would be an open redirect. An unsafe URL renders nothing, on
 * the same principle as an unrecognized type: showing a button that does
 * something hostile is worse than showing no button.
 */
export function AnnouncementActionButton({
  action,
}: {
  action: AnnouncementAction;
}) {
  const classes = buttonClasses({ size: "lg", fullWidth: true });

  switch (action.type) {
    case "internal":
      // In-app navigation only: a root-relative path. Anything absolute (or
      // protocol-relative, `//evil.com`) would leave the app while looking
      // like an internal link.
      if (!action.href.startsWith("/") || action.href.startsWith("//")) {
        return null;
      }
      return (
        <Link href={action.href} className={classes}>
          {action.label}
        </Link>
      );
    case "external":
      if (!isSafeUrl(action.url)) return null;
      return (
        <a
          href={action.url}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {action.label}
        </a>
      );
    default:
      return null;
  }
}
