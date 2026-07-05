import Link from "next/link";
import type { AnnouncementAction } from "@/lib/core/domain/account/announcement";
import { buttonClasses } from "@/components/ui/button";

/**
 * Resolves the backend→frontend action contract: internal actions navigate
 * in-app, external ones open a new tab. An unrecognized type renders NOTHING
 * (forward compatibility — the backend can ship new types without breaking
 * older clients).
 */
export function AnnouncementActionButton({
  action,
}: {
  action: AnnouncementAction;
}) {
  const classes = buttonClasses({ size: "lg", fullWidth: true });

  switch (action.type) {
    case "internal":
      return (
        <Link href={action.href} className={classes}>
          {action.label}
        </Link>
      );
    case "external":
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
