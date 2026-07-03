import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "جزئیات رمزارز | ناخدا",
};

// ponytail: PDP stub so market rows navigate somewhere. The real coin detail
// page is issue #6.
export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="text-[16px] text-muted">
        صفحه‌ی {symbol.toUpperCase()} به‌زودی آماده می‌شود.
      </p>
    </div>
  );
}
