import { describe, expect, it } from "vitest";
import { paginatedResponse, readPagination } from "@/lib/pagination";

describe("readPagination", () => {
  it("keeps legacy list responses when pagination is not requested", () => {
    expect(readPagination(new URLSearchParams())).toEqual({ enabled: false });
  });

  it("parses page offsets with the default page size", () => {
    expect(readPagination(new URLSearchParams("page=3"))).toEqual({
      enabled: true,
      value: { page: 3, pageSize: 20, skip: 40 },
    });
  });

  it("rejects invalid page sizes", () => {
    expect(readPagination(new URLSearchParams("page=1&pageSize=101"))).toEqual({
      enabled: true,
      error: "Page size must be between 1 and 100",
    });
  });
});

describe("paginatedResponse", () => {
  it("reports whether another chunk is available", () => {
    expect(paginatedResponse(["row"], { page: 2, pageSize: 20, skip: 20 }, 41)).toEqual({
      items: ["row"],
      page: 2,
      pageSize: 20,
      totalItems: 41,
      totalPages: 3,
      hasMore: true,
    });
  });
});
