import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
      <div className="space-y-4">
        {/* Front label */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-4/5" />
          </div>
        </div>

        {/* Back label */}
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <div className="h-9 w-24 bg-muted rounded-md" />
          <div className="h-9 w-20 bg-muted rounded-md" />
          <div className="h-9 w-20 bg-muted rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-label="Ładowanie fiszek">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
      <span className="sr-only">Trwa generowanie fiszek...</span>
    </div>
  );
}
