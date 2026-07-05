import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ThemeWatcher } from "@/components/layout/theme-watcher";
import { THEME_INIT_SCRIPT } from "@/lib/utils/theme";

export const viewport: Viewport = {
  // viewport-fit=cover lets env(safe-area-inset-*) resolve (iOS notch / home bar).
  viewportFit: "cover",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        {/* Sets .dark before first paint (system default or stored override). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeWatcher />
        {children}
      </body>
    </html>
  );
}
