// Static Persian legal content — replace with legal-approved copy before
// launch; the structure (sections + numbered clauses) stays. Single source of
// truth, shared by the public /terms and /privacy routes and the in-app
// «قوانین و حریم خصوصی» account page.

type SectionKey = "terms" | "privacy";

const SECTIONS: { key: SectionKey; title: string; items: string[] }[] = [
  {
    key: "terms",
    title: "قوانین استفاده",
    items: [
      "استفاده از ناخدا فقط برای اشخاص بالای ۱۸ سال و پس از تأیید هویت (احراز هویت) مجاز است.",
      "هر حساب متعلق به یک نفر است؛ خرید و فروش برای دیگران یا واگذاری حساب ممنوع است.",
      "واریز و برداشت تومانی فقط از کارت‌های بانکی به نام خودتان انجام می‌شود.",
      "قیمت رمزارزها نوسان دارد و ممکن است ارزش دارایی شما کم یا زیاد شود؛ مسئولیت تصمیم‌های معاملاتی با شماست.",
      "در صورت تشخیص فعالیت مشکوک، ناخدا می‌تواند حساب را تا روشن شدن موضوع محدود کند.",
    ],
  },
  {
    key: "privacy",
    title: "حریم خصوصی",
    items: [
      "اطلاعات هویتی شما فقط برای احراز هویت و رعایت قوانین نگهداری می‌شود و به هیچ شخص ثالثی فروخته نمی‌شود.",
      "شماره موبایل شما فقط برای ورود، کدهای تأیید و اطلاع‌رسانی‌های ضروری استفاده می‌شود.",
      "اطلاعات کارت بانکی فقط برای تطبیق واریز و برداشت به نام خودتان نگهداری می‌شود.",
      "می‌توانید از پشتیبانی درخواست کنید اطلاعات حساب شما پس از تسویه کامل حذف شود.",
    ],
  },
];

/**
 * Renders the legal sections. `only` narrows to a single section (public
 * /terms and /privacy each show one); omit it for the combined account page.
 */
export function LegalContent({ only }: { only?: SectionKey } = {}) {
  const sections = only ? SECTIONS.filter((s) => s.key === only) : SECTIONS;
  return (
    <article className="flex flex-1 flex-col gap-8 px-4 pb-10 pt-4">
      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-3">
          <h2 className="text-[18px] font-extrabold text-ink">
            {section.title}
          </h2>
          <ol className="flex list-inside list-decimal flex-col gap-2.5 marker:text-muted">
            {section.items.map((item, i) => (
              <li key={i} className="text-[15px] leading-8 text-ink">
                {item}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="text-[13px] leading-7 text-muted">
        این متن نسخه اولیه است و پیش از عرضه عمومی با نسخه تأییدشده حقوقی
        جایگزین می‌شود. سؤالی دارید؟ از پشتیبانی بپرسید.
      </p>
    </article>
  );
}
