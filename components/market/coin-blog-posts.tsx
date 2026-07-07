import type { BlogPost } from "@/lib/core/domain/market/coin-detail";
import { FileTextIcon } from "@/components/ui/icons";
import { formatJalaliDay } from "@/lib/utils/jalali";

/**
 * «مطالب مرتبط» — a short list of articles about this coin. Each row is a
 * teaser (title + one line + source·date); tapping opens the article. Mock
 * content for now; a real feed swaps in behind the same shape.
 */
export function CoinBlogPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-label="مطالب مرتبط" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">مطالب مرتبط</h2>
      <ul className="flex flex-col divide-y divide-line rounded-card bg-surface px-4">
        {posts.map((post) => (
          <li key={post.id}>
            <div className="flex items-start gap-3 py-3.5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <FileTextIcon size={18} />
              </span>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[14px] font-bold text-ink">{post.title}</h3>
                <p className="text-[13px] leading-6 text-muted">
                  {post.excerpt}
                </p>
                <span className="text-[12px] text-placeholder">
                  {post.source} · {formatJalaliDay(new Date(post.publishedAt))}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
