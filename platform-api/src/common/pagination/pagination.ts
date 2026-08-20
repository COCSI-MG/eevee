export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_PAGE_SIZE = 10;
export const PAGINATION_MAX_PAGE_SIZE = 100;

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationParams(query: {
  page?: number;
  pageSize?: number;
}): { page: number; pageSize: number; skip: number } {
  const page = query.page ?? PAGINATION_DEFAULT_PAGE;
  const pageSize = query.pageSize ?? PAGINATION_DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
