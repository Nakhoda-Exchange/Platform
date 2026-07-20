import type { Metadata } from "next";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "اعلان‌ها | ناخدا",
};

// Client-rendered: data is fetched in the browser via /api/account/announcements.
export default function AnnouncementsPage() {
  return <AnnouncementsClient />;
}
