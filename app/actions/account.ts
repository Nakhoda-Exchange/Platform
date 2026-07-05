"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE } from "./kyc-state";

/**
 * Ends the session and returns to the landing page. There is no persisted
 * auth session yet (the login mock only redirects), so this clears what state
 * exists (the pending-KYC cookie); wire real session teardown when auth lands.
 */
export async function logout(): Promise<void> {
  (await cookies()).delete(KYC_PENDING_COOKIE);
  redirect("/");
}

/** Announcements as serializable DTOs (Dates → ISO) for the client cache. */
export async function fetchAnnouncements(): Promise<
  import("@/lib/utils/announcements-db").AnnouncementDto[]
> {
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .execute();
  if (!result.ok) return [];
  return result.data.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    at: a.at.toISOString(),
    image: a.image,
    action: a.action,
  }));
}
