# Market — Product Requirements (PRD)

## Summary

The discovery home of the platform (Moonshot-inspired): a search bar, curated
sections (بیشترین رشد، پرطرفدارها، ارزهای جدید), and the browsable «همه
ارزها» list with filters — leading to a coin detail page (PDP) with a chart,
stats, and Buy/Sell entry into the trade flow.

## Goals

- A newcomer finds a coin in seconds: search or one scroll.
- Never color alone: 24h change pairs green/red with ▲/▼ and aria labels.
- Prices in Persian digits, IRT first, USD secondary. Real coin logos (the
  deliberate exception to the blue-only palette — identity).

## Non-goals (this tier)

- Favorites/watchlist, categories/tags, real-time streaming prices,
  candlestick charts.

## Screens

- **/market (PLP)** — search (name/symbol, Persian↔Latin digit
  normalization); typing hides curated sections and shows «نتایج جستجو»;
  empty state «رمزارزی پیدا نشد.». Filters scope the همه‌ارزها list: همه /
  بیشترین رشد / بیشترین ضرر / ارزش بازار. Search and filter state sync to
  the URL (`?q=`, `?f=`) so views are shareable — without RSC refetches.
- **/market/[symbol] (PDP)** — header (logo, name, price IRT+USD, 24h
  change), price chart with range tabs (۲۴ ساعت/۷ روز/۱ ماه/۱ سال, LTR),
  2×2 stats (high/low/market cap/volume), «درباره» blurb, and خرید/فروش
  CTAs deep-linking into `/trade/[symbol]?side=`.

## Mock behaviour

13 coins with real logos (`public/coins/*.png`); chart series are seeded
pseudo-random walks pinned to the current price (SSR/client agree).
