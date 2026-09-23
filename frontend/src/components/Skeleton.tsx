export function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div
            className={`bg-white rounded-xl border p-4 ${className}`}
            style={{ borderColor: "var(--color-border)" }}
        >
            <Skeleton className="h-3.5 w-24 mb-3" />
            <Skeleton className="h-7 w-20" />
        </div>
    );
}

export function SkeletonPanel({
    titleWidth = "w-40",
    height = 240,
    className = "",
}: {
    titleWidth?: string;
    height?: number;
    className?: string;
}) {
    return (
        <div
            className={`bg-white rounded-xl border p-4 ${className}`}
            style={{ borderColor: "var(--color-border)" }}
        >
            <Skeleton className={`h-4 ${titleWidth} mb-3`} />
            <div className="animate-pulse rounded-md bg-gray-200 w-full" style={{ height }} />
        </div>
    );
}

export function SkeletonTableRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-t">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="p-3">
                            <Skeleton className="h-4 w-full max-w-[10rem]" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export function SkeletonPaginationBar() {
    return (
        <div className="flex items-center justify-between p-3 border-t text-sm">
            <Skeleton className="h-4 w-28" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-7 w-14" />
            </div>
        </div>
    );
}