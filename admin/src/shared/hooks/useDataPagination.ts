import { useEffect, useMemo, useState } from "react";

/** Shared pagination state and slicing for every DataPanel-backed list. */
export function useDataPagination<T>(items: T[], resetKeys: readonly unknown[] = []) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  useEffect(() => { setPage(1); }, [...resetKeys, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return { page, pageSize, pageItems, setPage, setPageSize };
}
