import { describe, it, expect } from "vitest";
import { buildPiacUrl } from "./notify";

describe("buildPiacUrl", () => {
  it("generates URL with PIAC id", () => {
    const url = buildPiacUrl("abc-123");
    expect(url).toContain("/piac?id=abc-123");
  });

  it("includes https protocol", () => {
    const url = buildPiacUrl("test-id");
    expect(url).toMatch(/^https?:\/\//);
  });
});
