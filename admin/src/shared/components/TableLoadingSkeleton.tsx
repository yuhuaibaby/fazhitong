import type { CSSProperties } from "react";

interface TableLoadingSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableLoadingSkeleton({ columns = 7, rows = 8 }: TableLoadingSkeletonProps) {
  return (
    <div
      className="table-loading-skeleton"
      aria-label="加载中"
      style={{ "--table-loading-columns": columns } as CSSProperties}
    >
      <div className="table-loading-skeleton__head">
        {Array.from({ length: columns }).map((_, index) => (
          <span key={index} className="table-loading-skeleton__cell table-loading-skeleton__cell--head" />
        ))}
      </div>
      <div className="table-loading-skeleton__body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="table-loading-skeleton__row">
            {Array.from({ length: columns }).map((_, cellIndex) => (
              <span key={cellIndex} className="table-loading-skeleton__cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
