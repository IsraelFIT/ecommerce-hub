import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Store className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl mb-3">
        404
      </h1>
      <h2 className="text-xl font-semibold mb-2">Page or Store Not Found</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-8">
        The page or tenant store you requested does not exist or has been moved.
      </p>
      <Link href="/">
        <Button className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Button>
      </Link>
    </div>
  );
}
