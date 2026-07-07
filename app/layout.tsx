import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeWatcher } from "@/components/layout/theme-watcher";
import { THEME_INIT_SCRIPT } from "@/lib/utils/theme";
import { CurrencyUnitsHydrator } from "@/components/layout/currency-units-hydrator";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { setCurrencyUnits } from "@/lib/utils/money";
import { SplashScreen } from "@/components/pwa/splash-screen";
import { SplashHider } from "@/components/pwa/splash-hider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { BuildInfoLogger } from "@/components/layout/build-info-logger";

export const viewport: Viewport = {
  // viewport-fit=cover lets env(safe-area-inset-*) resolve (iOS notch / home bar).
  viewportFit: "cover",
  themeColor: "#0023fb",
};

// IRANYekanX ships as a single weight-variable file (wght 100–900), self-hosted
// from public/fonts. woff2 alone covers every browser we target.
const iranYekan = localFont({
  src: "../public/fonts/iran-yekan/woff2/IRANYekanXVF.woff2",
  variable: "--font-iranyekan",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ناخدا | دنیای آلت‌کوین‌ها، زیر نظر ناخدا",
  description:
    "ناخدا تجربه‌ای مدرن برای معامله آلت‌کوین‌ها فراهم کرده است؛ با تمرکز بر سرعت، سادگی و دسترسی به رمزارزهای متنوع.",
  applicationName: "ناخدا",
  appleWebApp: { capable: true, title: "ناخدا", statusBarStyle: "default" },
  // Demo site — no search engine or bot should index it (robots.ts + this meta).
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Currency unit labels are platform config served by the backend — set the
  // server-side formatter registry here and hand the client its copy below.
  const units = await container
    .resolve(TOKENS.GetCurrencyUnitsUseCase)
    .execute();
  const currencyUnits = units.ok ? units.data : { irt: "", usd: "" };
  setCurrencyUnits(currencyUnits);

  return (
    <html lang="fa" dir="rtl" className={`${iranYekan.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {/* Sets .dark before first paint (system default or stored override). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <SplashScreen />
        <CurrencyUnitsHydrator units={currencyUnits} />
        <ThemeWatcher />
        {children}
        <SplashHider />
        <ServiceWorkerRegister />
        <BuildInfoLogger />
      </body>
    </html>
  );
}
