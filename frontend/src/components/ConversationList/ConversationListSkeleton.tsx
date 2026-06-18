import { Skeleton } from "../Skeleton/Skeleton";

export function ConversationListSkeleton() {
  return (
    <ul
      className="conversation-list"
      aria-busy="true"
      aria-label="Loading conversations"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          style={{
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <Skeleton width={`${60 + (i % 3) * 10}%`} height={14} />
          <Skeleton width={`${40 + (i % 4) * 8}%`} height={10} />
        </li>
      ))}
    </ul>
  );
}