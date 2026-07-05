import type { PortfolioValuePoint } from "@/lib/core/domain/portfolio/portfolio-history";
import type { Transaction } from "@/lib/core/domain/wallet/transaction";

/**
 * Stamps cash movements onto a generated value series so the chart shows the
 * real steps: each deposit/withdraw marks its nearest point with an `event`,
 * and every EARLIER point is shifted by the opposite amount (before a deposit
 * the account genuinely held less; before a withdrawal, more). The series end
 * stays where the generator pinned it — the current total.
 *
 * Counted: done deposits, done/pending withdrawals (a pending withdrawal has
 * already left the cash balance in the mock). Trades swap assets without
 * changing the total, so they are not events.
 */
export function overlayTransactionEvents(
  points: PortfolioValuePoint[],
  transactions: Transaction[],
): PortfolioValuePoint[] {
  if (points.length < 2) return points;
  const stepMs = points[1].at - points[0].at;
  const floor = Math.max(
    1,
    Math.round(points[points.length - 1].valueIrt * 0.01),
  );

  const moves = transactions
    .filter(
      (t) =>
        (t.type === "deposit" && t.status === "done") ||
        (t.type === "withdraw" && t.status !== "failed"),
    )
    .map((t) => ({
      at: t.at.getTime(),
      signedIrt: t.type === "deposit" ? t.amountIrt : -t.amountIrt,
    }))
    .filter(
      (m) =>
        m.at >= points[0].at - stepMs / 2 &&
        m.at <= points[points.length - 1].at + stepMs / 2,
    );

  const offsets = new Array<number>(points.length).fill(0);
  const netAtIndex = new Map<number, number>();
  for (const move of moves) {
    const index = Math.min(
      points.length - 1,
      Math.max(0, Math.round((move.at - points[0].at) / stepMs)),
    );
    netAtIndex.set(index, (netAtIndex.get(index) ?? 0) + move.signedIrt);
    for (let i = 0; i < index; i++) offsets[i] -= move.signedIrt;
  }

  return points.map((p, i) => {
    const net = netAtIndex.get(i);
    return {
      ...p,
      valueIrt: Math.max(p.valueIrt + offsets[i], floor),
      ...(net
        ? {
            event: {
              type: net > 0 ? ("deposit" as const) : ("withdraw" as const),
              amountIrt: Math.abs(net),
            },
          }
        : {}),
    };
  });
}
