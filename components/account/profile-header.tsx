import Link from "next/link";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import { CheckCircleIcon, UserIcon } from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";

/** Avatar + name + phone, with the KYC status chip (or the CTA to finish it). */
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <section className="flex flex-col items-center gap-3 py-2 text-center">
      <span
        aria-hidden
        className="flex size-20 items-center justify-center rounded-full bg-brand/10 text-brand"
      >
        <UserIcon size={36} />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-[20px] font-extrabold text-ink">{profile.name}</h1>
        <span className="text-[15px] text-muted" dir="ltr">
          {toPersianDigits(profile.mobile)}
        </span>
      </div>
      {profile.kycVerified ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-[13px] font-bold text-brand">
          <CheckCircleIcon size={16} />
          هویت تأیید شده
        </span>
      ) : (
        <Link
          href="/kyc"
          className="inline-flex items-center rounded-full bg-brand px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-brand/90"
        >
          تکمیل احراز هویت
        </Link>
      )}
    </section>
  );
}
