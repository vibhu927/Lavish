import { cn } from "@/lib/utils";
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full bg-[var(--brand-sage)] text-white px-2.5 py-0.5 text-xs font-medium", className)} {...props} />;
}
export function TopRatedBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-[#9CB080] text-white px-3 py-1 text-xs font-semibold shadow-sm">★ Top Rated</span>;
}
