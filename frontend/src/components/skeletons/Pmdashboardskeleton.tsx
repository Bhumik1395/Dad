import { Skeleton, SkeletonCard, SkeletonPanel, SkeletonTableRows, SkeletonPaginationBar } from "../Skeleton";

export function PmDashboardSkeleton() {
    return (
        <div>
            <div className="grid grid-cols-4 gap-3 mb-6 items-center">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden mb-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="px-4 pt-3 pb-2">
                    <Skeleton className="h-4 w-44" />
                </div>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        <SkeletonTableRows rows={4} cols={5} />
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-xl border p-4 mb-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <Skeleton className="h-4 w-56 mb-2" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-8 w-28" />
                </div>
                <div className="animate-pulse rounded-md bg-gray-200 w-full" style={{ height: 240 }} />
            </div>

            <SkeletonPanel titleWidth="w-40" height={280} className="mb-4" />

            <div className="bg-white rounded-xl border overflow-hidden mb-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-56" />
                    </div>
                </div>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        <SkeletonTableRows rows={6} cols={6} />
                    </tbody>
                </table>
                <SkeletonPaginationBar />
            </div>
        </div>
    );
}