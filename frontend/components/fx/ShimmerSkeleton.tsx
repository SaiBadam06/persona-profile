import { cn } from "@/lib/utils";

export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}
