import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SplashScreen } from "@/components/pwa/splash-screen";
import { SplashHider } from "@/components/pwa/splash-hider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-ink">
        <SplashScreen />
        {children}
        <SplashHider />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
