import { Skeleton } from "@/components/ui/skeleton";

export default function MenuItemLoading() {
  return (
    <div className="min-h-screen bg-stone-50 py-5">
      <div className="container flex flex-col items-start gap-5">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded-sm" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>

        {/* Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
          {/* Left Column: Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="w-full aspect-square max-h-125 rounded-2xl" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-20 w-20 rounded-xl" />
              <Skeleton className="h-20 w-20 rounded-xl" />
              <Skeleton className="h-20 w-20 rounded-xl" />
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-8 w-2/3 rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>

            {/* Options / Variants */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <Skeleton className="h-4 w-24 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
