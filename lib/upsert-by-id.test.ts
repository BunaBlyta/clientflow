import { describe, expect, it } from "vitest";
import { upsertById } from "./upsert-by-id";

describe("upsertById", () => {
  it("replaces one matching row without changing the surrounding order", () => {
    const first = { id: "first", value: 1 };
    const second = { id: "second", value: 2 };
    const updated = { id: "first", value: 3 };

    expect(upsertById([first, second], updated)).toEqual([updated, second]);
  });

  it("appends a newly created row", () => {
    const first = { id: "first", value: 1 };
    const second = { id: "second", value: 2 };

    expect(upsertById([first], second)).toEqual([first, second]);
  });
});
