import Link from "next/link";
import { AnchorIcon } from "@/components/ui/icons";

/** Auth wordmark: blue "ناخدا" beside the anchor mark in a filled blue tile. */
export function AuthLogo() {
  return (
    <Link href="/" aria-label="ناخدا" className="flex items-center gap-3">
      <span className="text-[24px] font-extrabold leading-none text-brand">
        ناخدا
      </span>
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand text-white">
        <AnchorIcon size={20} />
      </span>
    </Link>
  );
}
