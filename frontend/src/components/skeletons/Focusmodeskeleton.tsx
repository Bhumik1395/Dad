import { Skeleton, SkeletonCard, SkeletonPanel, SkeletonTableRows, SkeletonPaginationBar } from "../Skeleton";

export function FocusModeSkeleton() {
    return (
        <div className="p-6">
            <div className="grid grid-cols-5 gap-3 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                ))}
            </div>
            <div className="h-5 mb-4" />

            <div className="grid grid-cols-3 gap-4 mb-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
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
                        <SkeletonTableRows rows={5} cols={8} />
                    </tbody>
                </table>
            </div>

            <SkeletonPanel titleWidth="w-44" height={240} className="mb-4" />
            <SkeletonPanel titleWidth="w-56" height={280} className="mb-4" />
            <SkeletonPanel titleWidth="w-48" height={200} className="mb-4" />

            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <div className="px-4 pt-3 pb-2">
                    <Skeleton className="h-4 w-52" />
                </div>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        <SkeletonTableRows rows={6} cols={3} />
                    </tbody>
                </table>
                <SkeletonPaginationBar />
            </div>
        </div>
    );
}