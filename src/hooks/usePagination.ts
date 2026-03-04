import { useState, useMemo } from "react";

export function usePagination<T>(data: T[], pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginated = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const next = () => goTo(page + 1);
  const prev = () => goTo(page - 1);

  // Reset page if data changes and current page is too high
  if (page > totalPages && totalPages > 0) setPage(totalPages);

  return { page, totalPages, paginated, goTo, next, prev, total: data.length };
}
