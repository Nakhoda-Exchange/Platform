/**
 * The backend→frontend CONTRACT for announcement actions. A discriminated
 * union: the backend picks a `type`, the client resolves how to open it.
 * Forward-compatible by design — a client that doesn't recognize a type
 * renders NO action (never a broken one), so the backend can add types
 * without breaking older clients.
 */
export type AnnouncementAction =
  /** Navigate inside the app (client-side), e.g. «واریز تومان» → /wallet/deposit */
  | { type: "internal"; label: string; href: string }
  /** Open an external destination (new tab), e.g. Instagram/Telegram */
  | { type: "external"; label: string; url: string };

/** A platform announcement shown under حساب کاربری → اعلان‌ها. */
export interface Announcement {
  id: string;
  title: string;
  body: string; // Persian markdown (first-party content — rendered as HTML)
  at: Date;
  image?: string; // optional banner image url
  action?: AnnouncementAction; // optional CTA per the contract above
}
