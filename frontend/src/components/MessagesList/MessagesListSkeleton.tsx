import { Skeleton } from "../Skeleton/Skeleton";

interface SkeletonRow {
  own: boolean;
  bodyWidth: string;
}

const SKELETON_ROWS: SkeletonRow[] = [
  { own: false, bodyWidth: "55%" },
  { own: true, bodyWidth: "35%" },
  { own: false, bodyWidth: "70%" },
  { own: true, bodyWidth: "45%" },
  { own: false, bodyWidth: "30%" },
  { own: true, bodyWidth: "60%" },
];

export function MessagesListSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading messages"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {SKELETON_ROWS.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: row.own ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              width: row.bodyWidth,
              maxWidth: "70%",
            }}
          >
            <Skeleton width={48} height={10} />
            <Skeleton width="100%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
