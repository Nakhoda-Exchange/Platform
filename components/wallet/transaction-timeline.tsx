import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import { TransactionListItem } from "./transaction-list-item";
import { formatJalaliDay } from "@/lib/utils/jalali";

/** «امروز» / «دیروز» for the two most recent days, Jalali date otherwise. */
function dayLabel(date: Date, now = new Date()): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diff === 0) return "امروز";
  if (diff === 1) return "دیروز";
  return formatJalaliDay(date);
}

/** History entries grouped under Jalali day headers (input already newest-first). */
export function TransactionTimeline({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = formatJalaliDay(tx.at);
    const group = groups.get(key);
    if (group) group.push(tx);
    else groups.set(key, [tx]);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...groups.values()].map((group) => (
        <section key={formatJalaliDay(group[0].at)} className="flex flex-col">
          <h2 className="py-1 text-[13px] font-bold text-muted">
            {dayLabel(group[0].at)}
          </h2>
          <ul className="flex flex-col divide-y divide-line">
            {group.map((tx) => (
              <li key={tx.id}>
                <TransactionListItem tx={tx} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
