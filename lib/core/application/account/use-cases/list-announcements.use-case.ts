import type { Announcement } from "@/lib/core/domain/account/announcement";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { AnnouncementsRepository } from "../ports/announcements-repository.port";

/** Announcements, newest first; byId for the detail page (null if unknown). */
export class ListAnnouncementsUseCase {
  constructor(private readonly announcements: AnnouncementsRepository) {}

  async execute(): Promise<Result<Announcement[]>> {
    const result = await this.announcements.listAnnouncements();
    if (!result.ok) return result;
    return ok([...result.data].sort((a, b) => b.at.getTime() - a.at.getTime()));
  }

  async byId(id: string): Promise<Result<Announcement | null>> {
    const result = await this.announcements.listAnnouncements();
    if (!result.ok) return result;
    return ok(result.data.find((a) => a.id === id) ?? null);
  }
}
