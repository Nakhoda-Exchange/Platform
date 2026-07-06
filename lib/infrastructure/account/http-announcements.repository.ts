import type { AnnouncementsRepository } from "@/lib/core/application/account/ports/announcements-repository.port";
import type { Announcement } from "@/lib/core/domain/account/announcement";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { HttpClient } from "../http/http-client";

/** Wire shape: `at` travels as ISO 8601. Contract: doc/announcements/api.md. */
type AnnouncementDto = Omit<Announcement, "at"> & { at: string };

/** HTTP adapter for platform announcements. */
export class HttpAnnouncementsRepository implements AnnouncementsRepository {
  constructor(private readonly http: HttpClient) {}

  async listAnnouncements(): Promise<Result<Announcement[]>> {
    const result = await this.http.get<AnnouncementDto[]>("/announcements");
    if (!result.ok) return result;
    return ok(result.data.map((a) => ({ ...a, at: new Date(a.at) })));
  }
}
