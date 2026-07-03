// Goftino support-chat widget — the JS API surface we use.
// Docs: https://www.goftino.com/docs

interface GoftinoApi {
  open(): void;
  close(): void;
  toggle(): void;
  setWidget(options: { hasIcon?: boolean }): void;
}

declare global {
  interface Window {
    Goftino?: GoftinoApi;
  }
}

/** Widget id from the Goftino panel — set NEXT_PUBLIC_GOFTINO_WIDGET_ID in .env. */
export const GOFTINO_WIDGET_ID =
  process.env.NEXT_PUBLIC_GOFTINO_WIDGET_ID ?? "";

/**
 * Open the support chat from a custom button. The default floating launcher is
 * hidden (see GoftinoChat), so this is the only way in.
 */
export function openSupportChat(): void {
  window.Goftino?.open();
}
