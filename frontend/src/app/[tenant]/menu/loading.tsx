import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Menu Hero Skeleton */}
      <div className="w-full bg-stone-900 py-16 px-6 md:px-12 text-center flex flex-col items-center gap-4">
        <Skeleton className="h-4 w-32 rounded-full bg-stone-800" />
        <Skeleton className="h-10 w-72 rounded-xl bg-stone-800" />
        <Skeleton className="h-4 w-96 rounded-md bg-stone-800" />
      </div>

      {/* Menu List Skeleton Grid */}
      <div className="container mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="p-5 bg-card rounded-2xl border border-border space-y-4">
              <Skeleton className="h-5 w-28 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Catalog */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-3 space-y-3 shadow-xs"
                >
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
