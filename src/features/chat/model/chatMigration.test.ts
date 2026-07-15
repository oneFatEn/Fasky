import { describe, expect, it } from "vitest";
import { createProject } from "../../../defaultProject";
import { hasUnresolvedTimeSegments, migrateChatProject } from "./chatMigration";

describe("chat schema migration", () => {
  it("migrates exact legacy timestamps and associates following messages", () => {
    const project = createProject("wechat") as unknown as Record<string, unknown>;
    const legacy = structuredClone(project) as any;
    delete legacy.content.referenceTimestamp;
    legacy.content.referenceDate = "2026-07-14";
    legacy.schemaVersion = 1;
    legacy.content.items[0] = { id: "segment-a", kind: "time-divider", label: "2026-07-14-16-28" };
    legacy.content.items.slice(1).forEach((item: any) => { delete item.timeSegmentId; delete item.timestamp; });
    const migrated = migrateChatProject(legacy);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.content.referenceDate).toBe("2026-07-14");
    expect(migrated.content.items[0]).toMatchObject({ timestamp: "2026-07-14T16:28" });
    expect(migrated.content.items.slice(1).every((item) => item.kind !== "message" || (
      item.timeSegmentId === "segment-a" && !("timestamp" in item)
    ))).toBe(true);
  });

  it("keeps only the calendar date when migrating the schema 3 reference timestamp", () => {
    const project = createProject("wechat") as any;
    project.schemaVersion = 3;
    delete project.content.referenceDate;
    project.content.referenceTimestamp = "2026-07-14T22:05";
    const migrated = migrateChatProject(project);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.content.referenceDate).toBe("2026-07-14");
    expect("referenceTimestamp" in migrated.content).toBe(false);
  });

  it("does not guess an unparseable free-text label", () => {
    const project = createProject("wechat") as any;
    project.schemaVersion = 1;
    delete project.content.referenceTimestamp;
    project.content.referenceDate = "2026-07-14";
    project.content.items[0] = { id: "segment-a", kind: "time-divider", label: "今天下午" };
    project.content.items.slice(1).forEach((item: any) => { delete item.timestamp; });
    const migrated = migrateChatProject(project);
    expect(migrated.content.items[0]).toMatchObject({
      timestamp: null,
      legacyLabel: "今天下午",
      requiresConfirmation: true,
    });
    expect(hasUnresolvedTimeSegments(migrated)).toBe(true);
  });
});
