import { describe, expect, it } from "vitest";
import {
  formatEditorTimestamp,
  formatLocalDateTime,
  formatTimeOfDay,
  formatTimeSegment,
} from "./localDateTime";

describe("local chat date formatting", () => {
  it("persists local calendar components without UTC conversion", () => {
    const value = new Date(2026, 6, 14, 23, 45);
    expect(formatLocalDateTime(value)).toBe("2026-07-14T23:45");
    expect(formatEditorTimestamp("2026-07-14T23:45")).toBe("2026-07-14-23-45");
  });

  it.each([
    ["2026-07-14T08:05", "2026-07-14", "Today 08:05"],
    ["2026-07-13T23:59", "2026-07-14", "Yesterday 23:59"],
    ["2026-01-01T00:01", "2026-07-14", "01-01 00:01"],
    ["2025-12-31T23:59", "2026-01-01", "Yesterday 23:59"],
    ["2025-12-30T23:59", "2026-01-01", "2025-12-30 23:59"],
  ])("formats %s relative to %s", (timestamp, referenceDate, expected) => {
    expect(formatTimeSegment(timestamp, referenceDate)).toBe(expected);
  });

  it("uses local calendar boundaries instead of elapsed milliseconds", () => {
    expect(formatTimeSegment("2026-03-08T23:30", "2026-03-09")).toBe("Yesterday 23:30");
    expect(formatTimeSegment("2026-12-31T23:59", "2027-01-01")).toBe("Yesterday 23:59");
  });

  it("derives bubble corner time from the time segment", () => {
    expect(formatTimeOfDay("2026-07-14T16:28")).toBe("16:28");
    expect(formatTimeOfDay(null)).toBeUndefined();
  });
});
