import type { CSSProperties, ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sticky?: "left" | "right";
  lineClamp?: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
}

function isIdentifierColumn<T>(column: Column<T>): boolean {
  const label = typeof column.label === "string" ? column.label : "";
  return /标识/.test(label) || /Code$|Codes$|reqId$|pointCode$|caseCode$/.test(column.key);
}

export function DataTable<T>({ columns, rows, getRowKey }: DataTableProps<T>) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const identifierColumn = isIdentifierColumn(column);
              return (
                <th
                  key={column.key}
                  className={`align-center${column.sticky ? ` sticky-${column.sticky}` : ""}${identifierColumn ? " data-table__identifier-col" : ""}`}
                  style={identifierColumn ? undefined : (column.width ? { width: column.width, minWidth: column.width } : undefined)}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} data-row-key={getRowKey(row)}>
              {columns.map((column) => {
                const identifierColumn = isIdentifierColumn(column);
                return (
                  <td
                    key={column.key}
                    className={`align-${column.align ?? "center"}${column.sticky ? ` sticky-${column.sticky}` : ""}${column.lineClamp ? " data-table__td--multiline" : ""}${identifierColumn ? " data-table__identifier-col" : ""}`}
                    style={{
                      ...(!identifierColumn && column.width ? { width: column.width, minWidth: column.width } : {}),
                      ...(column.lineClamp ? { "--line-clamp": column.lineClamp } as CSSProperties : {}),
                    }}
                  >
                    {column.lineClamp ? (
                      <div className="data-table__cell-multiline-frame">
                        <div className="data-table__cell-layout-sizer" aria-hidden="true">
                          {column.render(row)}
                        </div>
                        <div className="data-table__cell-multiline">
                          {column.render(row)}
                        </div>
                      </div>
                    ) : column.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
