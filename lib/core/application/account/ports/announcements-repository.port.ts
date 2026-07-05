import type { Announcement } from "@/lib/core/domain/account/announcement";
import type { Result } from "@/lib/core/domain/shared/result";

/** Port for platform announcements. Adapters live in infrastructure. */
export interface AnnouncementsRepository {
  listAnnouncements(): Promise<Result<Announcement[]>>;
}
