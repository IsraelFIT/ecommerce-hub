import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar Skeleton */}
      <div className="w-full border-b border-border/40 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="container mx-auto px-6 md:px-12 py-20 flex flex-col items-center text-center space-y-6">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-14 w-3/4 max-w-2xl rounded-2xl" />
        <Skeleton className="h-5 w-1/2 max-w-lg rounded-md" />
        <div className="flex items-center gap-4 pt-4">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>

      {/* Feature Grid Skeleton */}
      <div className="container mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border bg-card space-y-4"
          >
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
