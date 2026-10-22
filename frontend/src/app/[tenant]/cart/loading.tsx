import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="py-24 bg-stone-50 text-stone-900 min-h-screen">
      <div className="container">
        {/* Header Skeleton */}
        <div className="w-full mb-12 space-y-3">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>

        {/* Cart Grid Skeleton */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Items List Skeleton (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-white rounded-2xl border border-stone-200/80 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-44 rounded-md" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card Skeleton (4 cols) */}
          <div className="lg:col-span-4 p-6 bg-white rounded-2xl border border-stone-200/80 space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100 flex justify-between">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl pt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
