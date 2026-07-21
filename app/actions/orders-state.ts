/**
 * Result of cancelling an open order (types live beside the "use server" file).
 * `alreadyExecuted` flags the 409 race (the order executed before the cancel
 * landed) so the UI shows «already executed» and refreshes the list, rather than
 * a generic error.
 */
export type CancelOrderState =
  { ok: true } | { ok: false; alreadyExecuted: boolean; message: string };
