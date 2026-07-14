import { describe, expect, it } from "vitest";
import { createProject } from "../../../defaultProject";
import { hasUnresolvedTimeSegments, migrateChatProject } from "./chatMigration";

describe("chat schema migration", () => {
  it("migrates exact legacy timestamps and associates following messages", () => {
    const project = createProject("wechat") as unknown as Record<string, unknown>;
    const legacy = structuredClone(project) as any;
    delete legacy.content.referenceDate;
    legacy.schemaVersion = 1;
    legacy.content.items[0] = { id: "segment-a", kind: "time-divider", label: "2026-07-14-16-28" };
    legacy.content.items.slice(1).forEach((item: any) => { delete item.timeSegmentId; });
    const migrated = migrateChatProject(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.content.items[0]).toMatchObject({ timestamp: "2026-07-14T16:28" });
    expect(migrated.content.items.slice(1).every((item) => item.kind !== "message" || item.timeSegmentId === "segment-a")).toBe(true);
  });

  it("does not guess an unparseable free-text label", () => {
    const project = createProject("wechat") as any;
    project.schemaVersion = 1;
    delete project.content.referenceDate;
    project.content.items[0] = { id: "segment-a", kind: "time-divider", label: "今天下午" };
    const migrated = migrateChatProject(project);
    expect(migrated.content.items[0]).toMatchObject({
      timestamp: null,
      legacyLabel: "今天下午",
      requiresConfirmation: true,
    });
    expect(hasUnresolvedTimeSegments(migrated)).toBe(true);
  });
});
