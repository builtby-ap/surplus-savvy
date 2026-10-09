import { describe, expect, test } from "vitest";
import { recordedStatusTime } from "./order-timestamps";

describe("recorded order times", () => {
  const placed = "2026-10-08T08:00:00Z";
  test("uses the recorded timestamp for each status", () => {
    expect(recordedStatusTime("confirmed", placed, { confirmed: "2026-10-08T08:05:00Z" })).toBe("2026-10-08T08:05:00Z");
  });
  test("does not invent past status times", () => {
    expect(recordedStatusTime("preparing", placed)).toBeUndefined();
  });
  test("uses placed time for the initial order status", () => {
    expect(recordedStatusTime("pending", placed)).toBe(placed);
  });
  test("maps delivery and pickup database status keys", () => {
    expect(recordedStatusTime("out-for-delivery", placed, { out_for_delivery: "2026-10-08T08:15:00Z" })).toBe("2026-10-08T08:15:00Z");
    expect(recordedStatusTime("picked-up", placed, { picked_up: "2026-10-08T08:20:00Z" })).toBe("2026-10-08T08:20:00Z");
  });
});