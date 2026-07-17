import { Skeleton } from "@/components/ui/skeleton";

/** Instant pending UI for /dashboard/* soft navigations — layout-only, no design change. */
export default function DashboardLoading() {
  return (
    <div className="px-15 pb-15 pt-10 space-y-10" aria-busy="true" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-36 w-80 rounded-xl" />
          <Skeleton className="h-36 w-80 rounded-xl" />
          <Skeleton className="h-36 w-80 rounded-xl" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-36 w-80 rounded-xl" />
          <Skeleton className="h-36 w-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
