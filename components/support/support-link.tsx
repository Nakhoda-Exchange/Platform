"use client";

import { openSupportChat } from "./goftino";

/**
 * A plain text-styled button that opens the Goftino support chat. Used where a
 * "پشتیبانی" link is expected (login, footer, declined) but there is no route —
 * the widget is the destination. Styling comes from the caller via `className`.
 */
export function SupportLink({
  children = "پشتیبانی",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={openSupportChat} className={className}>
      {children}
    </button>
  );
}
