import type { Metadata } from "next";
import { AnnouncementClient } from "./announcement-client";

export const metadata: Metadata = {
  title: "اعلان‌ها | ناخدا",
};

// Client-rendered: data is fetched in the browser via
// /api/account/announcements/[id].
export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementClient id={id} />;
}
