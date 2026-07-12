import Link from "next/link";
import type { UserProfile } from "@/lib/core/domain/account/profile";
import { CheckCircleIcon, UserIcon } from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * Compact identity card: a generic user avatar + name + phone on the right, and
 * KYC status on the left — a chip when verified, a «تکمیل احراز هویت» call when
 * not. One tight row instead of a tall centered stack.
 */
export function ProfileHeader({ profile }: { profile: UserProfile }) {
  return (
    <section className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4">
      <span
        aria-hidden
        className="flex size-13 shrink-0 items-center justify-center rounded-full bg-brand text-white"
      >
        <UserIcon size={26} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="truncate text-[17px] font-extrabold text-ink">
          {profile.name}
        </h1>
        <span dir="ltr" className="text-right text-[13px] text-muted">
          {toPersianDigits(profile.mobile)}
        </span>
      </div>
      {profile.kycVerified ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-[12px] font-bold text-brand">
          <CheckCircleIcon size={14} />
          تأیید شده
        </span>
      ) : (
        <Link
          href="/kyc"
          className="shrink-0 rounded-full bg-brand px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-brand/90"
        >
          تکمیل احراز
        </Link>
      )}
    </section>
  );
}
