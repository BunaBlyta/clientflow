export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  pageSize: number;
  skip: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
};

export function readPagination(searchParams: URLSearchParams):
  | { enabled: false }
  | { enabled: true; value: Pagination }
  | { enabled: true; error: string } {
  const isEnabled = searchParams.has("page") || searchParams.has("pageSize");
  if (!isEnabled) return { enabled: false };

  const rawPage = searchParams.get("page") ?? "1";
  const rawPageSize = searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE);
  if (!/^\d+$/.test(rawPage) || !/^\d+$/.test(rawPageSize)) {
    return { enabled: true, error: "Page and page size must be positive integers" };
  }

  const page = Number(rawPage);
  const pageSize = Number(rawPageSize);
  if (
    !Number.isSafeInteger(page) ||
    !Number.isSafeInteger(pageSize) ||
    page < 1 ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE ||
    (page - 1) * pageSize > Number.MAX_SAFE_INTEGER
  ) {
    return { enabled: true, error: `Page size must be between 1 and ${MAX_PAGE_SIZE}` };
  }

  return {
    enabled: true,
    value: { page, pageSize, skip: (page - 1) * pageSize },
  };
}

export function paginatedResponse<T>(
  items: T[],
  pagination: Pagination,
  totalItems: number,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize));
  return {
    items,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems,
    totalPages,
    hasMore: pagination.page * pagination.pageSize < totalItems,
  };
}
