import { Skeleton } from "@/components/ui/skeleton";

export default function TenantLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Navbar Skeleton */}
      <div className="w-full border-b border-stone-200/60 bg-white/80 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="container mx-auto px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-1">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-4/5 rounded-xl" />
            <Skeleton className="h-12 w-3/5 rounded-xl" />
          </div>
          <Skeleton className="h-5 w-full max-w-md rounded-md" />
          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>
        <div className="flex justify-center">
          <Skeleton className="w-full max-w-lg aspect-square rounded-3xl" />
        </div>
      </div>

      {/* Products Row Skeleton */}
      <div className="container mx-auto px-6 md:px-12 py-12 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-56 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 bg-white rounded-2xl border border-stone-200/80 space-y-3"
            >
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
              <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
