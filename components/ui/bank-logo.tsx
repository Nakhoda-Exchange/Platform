import {
  detectBankByCard,
  detectBankByIban,
} from "@/lib/core/domain/wallet/iranian-banks";
import { CreditCardIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

/** First letter of the distinguishing word in a bank name, for the monogram. */
function monogram(name: string): string {
  // Drop a leading «بانک»/«موسسه اعتباری» so «بانک سامان» → «س», keep «پست بانک» → «پ».
  const word =
    name.replace(/^(بانک|موسسه اعتباری)\s+/u, "").trim() || name.trim();
  return Array.from(word)[0] ?? "؟";
}

/** WCAG relative luminance of a `#rrggbb` hex color, 0 (black) – 1 (white). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two relative luminances. */
function contrast(l1: number, l2: number): number {
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

// The tile background is a fixed brand color, not theme-swapping — so the
// monogram color must be fixed too. Never use a theme token (e.g. text-ink)
// here, it would flip in dark mode while the tile stays the same color.
const DARK_INK_HEX = "#1a1b1e";
const DARK_INK_CLASS = "text-[#1a1b1e]";

/** Pick whichever of white or a fixed dark ink reads better against the tile. */
function monogramColor(hex: string): string {
  const tileLum = luminance(hex);
  const withWhite = contrast(tileLum, 1);
  const withDarkInk = contrast(tileLum, luminance(DARK_INK_HEX));
  return withDarkInk > withWhite ? DARK_INK_CLASS : "text-white";
}

/**
 * Bank mark, detected from a card number or IBAN: a tile in the bank's brand
 * color with its monogram. The color IS the identity (paired with the bank
 * name in the row caption), which reads clean at icon size — full logo
 * lockups do not. Falls back to a neutral tile when the value doesn't resolve
 * to a bank yet (too few digits, or unrecognized). Brand color is real-brand
 * data, a deliberate exception to the blue-only palette, like CoinIcon.
 */
export function BankLogo({
  kind,
  value,
  size = 44,
  className,
}: {
  kind: "card" | "iban";
  value: string;
  size?: number;
  className?: string;
}) {
  const bank =
    kind === "card" ? detectBankByCard(value) : detectBankByIban(value);

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-field font-extrabold",
        bank
          ? monogramColor(bank.color)
          : "border border-line bg-surface text-muted",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        ...(bank ? { backgroundColor: bank.color } : {}),
      }}
    >
      {bank ? (
        monogram(bank.name)
      ) : (
        <CreditCardIcon size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}
