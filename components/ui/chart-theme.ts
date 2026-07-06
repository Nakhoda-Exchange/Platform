"use client";

/** Concrete colors for ECharts — it can't consume `var(--x)` strings. */
export interface Tones {
  brand: string;
  brandSoft: string;
  muted: string;
  paper: string;
  gain: string;
  loss: string;
}

export function readTones(): Tones {
  const style = getComputedStyle(document.documentElement);
  return {
    brand: style.getPropertyValue("--color-brand").trim() || "#0023fb",
    brandSoft:
      style.getPropertyValue("--color-brand-soft").trim() ||
      "rgba(0,35,251,0.05)",
    muted: style.getPropertyValue("--color-muted").trim() || "#696969",
    paper: style.getPropertyValue("--color-paper").trim() || "#ffffff",
    gain: style.getPropertyValue("--color-gain").trim() || "#15803d",
    loss: style.getPropertyValue("--color-loss").trim() || "#b91c1c",
  };
}

// The root `.dark` class flips tokens (account picker or OS theme); watching
// it as an external store re-renders the chart with freshly read tones.
export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}
