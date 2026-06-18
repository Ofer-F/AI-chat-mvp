interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
  }
  
  export function Skeleton({ width = "100%", height = 16, borderRadius = 4 }: SkeletonProps) {
    return (
      <div
        aria-hidden
        data-skeleton
        style={{
          width,
          height,
          borderRadius,
          background:
            "linear-gradient(90deg, var(--skeleton-base) 0%, var(--skeleton-highlight) 50%, var(--skeleton-base) 100%)",
          backgroundSize: "200% 100%",
          animation: "skeleton-shimmer 1.4s ease-in-out infinite",
        }}
      />
    );
  }