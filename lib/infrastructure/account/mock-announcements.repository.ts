import type { AnnouncementsRepository } from "@/lib/core/application/account/ports/announcements-repository.port";
import type { Announcement } from "@/lib/core/domain/account/announcement";
import { ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ago = (days: number) => new Date(Date.now() - days * 86_400_000);

// Canned announcements (per-process). Swap for an HTTP adapter in the
// composition root when the backend lands.
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "card-deposit",
    title: "واریز کارت‌به‌کارت راه‌اندازی شد",
    body: "از امروز می‌توانید موجودی تومانی خود را **کارت‌به‌کارت** شارژ کنید.\n\n۱. از صفحه «کیف پول» گزینه واریز را بزنید\n۲. کارت خود را انتخاب کنید\n۳. مبلغ را به شماره کارتی که نمایش داده می‌شود منتقل کنید\n\nتأیید واریز به‌صورت **خودکار** انجام می‌شود.",
    at: ago(1),
    action: { type: "internal", label: "واریز تومان", href: "/wallet/deposit" },
  },
  {
    id: "new-memes",
    title: "سه ارز جدید فهرست شد",
    body: "ارزهای **WIF**، **BOME** و **MEW** به فهرست بازار ناخدا اضافه شدند.\n\nاین ارزها را می‌توانید از بخش «ارزهای جدید» بازار ببینید و معامله کنید. مثل همیشه، پیش از خرید حتماً درباره پروژه تحقیق کنید.",
    at: ago(3),
    image: "/coins/wif.png",
    action: { type: "internal", label: "دیدن بازار", href: "/market" },
  },
  {
    id: "maintenance",
    title: "به‌روزرسانی سامانه؛ جمعه ساعت ۲ بامداد",
    body: "برای بهبود سرعت و پایداری، جمعه از ساعت ۲ تا ۴ بامداد سامانه در دسترس نخواهد بود.\n\nدارایی‌های شما در این مدت کاملاً امن است و سفارش‌های باز شما تغییری نمی‌کنند.",
    at: ago(6),
  },
  {
    id: "welcome",
    title: "به ناخدا خوش آمدید",
    body: "ناخدا با تمرکز بر **سادگی** ساخته شده تا خرید و فروش آلت‌کوین‌ها برای همه آسان باشد.\n\nاگر سؤالی داشتید، از دکمه پشتیبانی در بالای صفحه استفاده کنید؛ همیشه در دسترس هستیم.",
    at: ago(12),
    action: {
      type: "external",
      label: "عضویت در تلگرام ناخدا",
      url: "https://t.me/nakhoda_exchange",
    },
  },
];

export class MockAnnouncementsRepository implements AnnouncementsRepository {
  async listAnnouncements(): Promise<Result<Announcement[]>> {
    await delay();
    return ok(ANNOUNCEMENTS);
  }
}
