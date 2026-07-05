/** A platform announcement shown under حساب کاربری → اعلان‌ها. */
export interface Announcement {
  id: string;
  title: string;
  body: string; // Persian paragraphs, separated by blank lines
  at: Date;
}
