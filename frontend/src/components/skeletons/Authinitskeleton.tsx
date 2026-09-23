import { Skeleton } from "../Skeleton";

export function AuthInitSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
            <div className="bg-white rounded-xl border p-10 w-[440px]" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex flex-col items-center mb-6">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-9 w-full mb-4" />
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-9 w-full mb-6" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}