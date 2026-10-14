import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="py-20 bg-stone-50 text-stone-900 min-h-screen">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Header Skeleton */}
        <div className="mb-10 space-y-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-10 w-56 rounded-xl" />
        </div>

        {/* 2-Column Form & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Form Skeleton (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 bg-white rounded-2xl border border-stone-200/80 space-y-4">
              <Skeleton className="h-5 w-40 rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            <div className="p-6 bg-white rounded-2xl border border-stone-200/80 space-y-4">
              <Skeleton className="h-5 w-36 rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Order Summary Skeleton (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-stone-200/80 space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-xl pt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
