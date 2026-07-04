import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/pwa/splash-screen";
import { SplashHider } from "@/components/pwa/splash-hider";

export const viewport: Viewport = {
  // viewport-fit=cover lets env(safe-area-inset-*) resolve (iOS notch / home bar).
  viewportFit: "cover",
  themeColor: "#0023fb",
};

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ناخدا | دنیای آلت‌کوین‌ها، زیر نظر ناخدا",
  description:
    "ناخدا تجربه‌ای مدرن برای معامله آلت‌کوین‌ها فراهم کرده است؛ با تمرکز بر سرعت، سادگی و دسترسی به رمزارزهای متنوع.",
  applicationName: "ناخدا",
  appleWebApp: { capable: true, title: "ناخدا", statusBarStyle: "default" },
};

// No service worker for now: a caching SW intercepts Next's navigation/RSC
// requests and forces hard reloads (esp. on iOS). This runs before hydration to
// kill any SW a previous build installed and clear its caches, then reloads once
// so stuck devices recover. The app stays installable via the manifest.
const swCleanup = `(function(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(rs){var had=rs.length>0;rs.forEach(function(r){r.unregister()});if('caches' in window){caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k)})})}if(had&&!sessionStorage.getItem('sw-cleared')){sessionStorage.setItem('sw-cleared','1');location.reload()}}).catch(function(){})})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-ink">
        <Script
          id="sw-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: swCleanup }}
        />
        <SplashScreen />
        {children}
        <SplashHider />
      </body>
    </html>
  );
}
