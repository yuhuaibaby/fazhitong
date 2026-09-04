import type { CSSProperties } from "react";
import { TableLoadingSkeleton } from "./TableLoadingSkeleton";

interface DataPanelSkeletonProps {
  filters?: number;
  actions?: number;
  columns?: number;
  rows?: number;
}

export function DataPanelSkeleton({
  filters = 3,
  actions = 1,
  columns = 7,
  rows = 8,
}: DataPanelSkeletonProps) {
  return (
    <div
      className="data-panel data-panel-skeleton"
      style={{
        "--data-panel-skeleton-filters": filters,
        "--data-panel-skeleton-actions": actions,
      } as CSSProperties}
      aria-label="页面加载中"
    >
      <div className="data-panel__toolbar data-panel-skeleton__toolbar">
        <div className="data-panel-skeleton__filters">
          {Array.from({ length: filters }).map((_, index) => (
            <div className="data-panel-skeleton__filter" key={index}>
              <span className="data-panel-skeleton__label" />
              <span className="data-panel-skeleton__control" />
            </div>
          ))}
        </div>
        <div className="data-panel-skeleton__actions">
          {Array.from({ length: actions }).map((_, index) => (
            <span className="data-panel-skeleton__button" key={index} />
          ))}
        </div>
      </div>
      <div className="data-panel__content">
        <TableLoadingSkeleton columns={columns} rows={rows} />
      </div>
      <div className="data-panel__pagination data-panel-skeleton__pagination">
        <span className="data-panel-skeleton__page-info" />
        <span className="data-panel-skeleton__page-size" />
        <span className="data-panel-skeleton__page-buttons" />
      </div>
    </div>
  );
}
