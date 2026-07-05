import QRCode from "qrcode";
import type { Coin } from "@/lib/core/domain/market/coin";
import type { DepositAddress } from "@/lib/core/domain/wallet/deposit";
import { CoinIcon } from "@/components/market/coin-icon";
import { CopyButton } from "./copy-button";

/**
 * Crypto deposit: the coin's address + network + QR. Server component — the
 * QR SVG is rendered server-side (no client JS beyond the copy button).
 */
export async function CryptoDepositView({
  coin,
  deposit,
}: {
  coin: Coin;
  deposit: DepositAddress;
}) {
  const qrSvg = await QRCode.toString(deposit.address, {
    type: "svg",
    margin: 0,
    color: { dark: "#1a1b1e", light: "#ffffff" },
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-2">
        <CoinIcon coin={coin} size={28} />
        <span className="text-[15px] font-bold text-ink">
          واریز {coin.name}
        </span>
      </div>

      <div
        aria-label={`کد QR آدرس واریز ${coin.name}`}
        role="img"
        className="w-44 rounded-card border border-line bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />

      <div className="flex w-full flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">آدرس واریز</span>
        <p
          dir="ltr"
          className="rounded-field border border-line bg-surface p-3 text-center font-mono text-[13px] break-all text-ink select-all"
        >
          {deposit.address}
        </p>
        <span className="text-[13px] text-muted">
          شبکه: <span className="font-bold text-ink">{deposit.network}</span>
        </span>
      </div>

      <CopyButton value={deposit.address} />

      <p className="text-[13px] leading-6 text-muted">
        فقط {coin.symbol} را از طریق شبکه بالا به این آدرس بفرستید؛ ارسال رمزارز
        یا شبکه دیگر باعث از دست رفتن دارایی می‌شود.
      </p>
    </div>
  );
}
