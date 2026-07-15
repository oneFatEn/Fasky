import { describe, expect, it } from "vitest";
import { createProject } from "../../../defaultProject";
import { addEventPoint, appendMessageToPoint, applyTemplate, insertChatItem, moveMessageWithinPoint, updateChatProject } from "./chatActions";
import { CHAT_TEMPLATES } from "../../../templates";

describe("chat actions", () => {
  it("updates a cloned project without mutating the source", () => {
    const source = createProject("wechat");
    const next = updateChatProject(source, (draft) => { draft.title = "新标题"; });
    expect(source.title).not.toBe("新标题");
    expect(next.title).toBe("新标题");
  });

  it("restores a deleted item at its original ordered position", () => {
    const project = createProject("wechat");
    const item = project.content.items.splice(1, 1)[0];
    expect(item).toBeDefined();
    if (!item) return;
    insertChatItem(project, item, 1);
    expect(project.content.items[1]?.id).toBe(item.id);
  });

  it("applies template tokens by participant identity", () => {
    const project = createProject("wechat");
    applyTemplate(project, "whatsapp");
    const current = project.content.participants.find((person) => person.id === project.content.currentParticipantId);
    const other = project.content.participants.find((person) => person.id !== project.content.currentParticipantId);
    expect(project.content.templateId).toBe("whatsapp");
    expect(current?.bubbleColor).toBe(CHAT_TEMPLATES.whatsapp.ownBubble);
    expect(other?.bubbleColor).toBe(CHAT_TEMPLATES.whatsapp.otherBubble);
  });

  it("inserts a blank message at the end of its time segment", () => {
    const project = createProject("wechat");
    const firstSegment = project.content.items.find((item) => item.kind === "time-divider");
    expect(firstSegment).toBeDefined();
    if (!firstSegment) return;
    const secondSegmentId = crypto.randomUUID();
    project.content.items.push({
      id: secondSegmentId,
      kind: "time-divider",
      timestamp: "2026-07-15T09:00",
    });
    const senderId = project.content.currentParticipantId;
    const message = appendMessageToPoint(project, firstSegment.id, senderId);
    const secondSegmentIndex = project.content.items.findIndex((item) => item.id === secondSegmentId);
    expect(project.content.items[secondSegmentIndex - 1]?.id).toBe(message.id);
    expect(message).toMatchObject({ senderId, pointId: firstSegment.id, content: "" });
  });

  it("uses the requested participant for left and right segment insertion", () => {
    const project = createProject("whatsapp");
    const segment = project.content.items.find((item) => item.kind === "time-divider");
    const current = project.content.currentParticipantId;
    const other = project.content.participants.find((person) => person.id !== current)?.id;
    expect(segment && other).toBeTruthy();
    if (!segment || !other) return;
    const left = appendMessageToPoint(project, segment.id, other);
    const right = appendMessageToPoint(project, segment.id, current);
    expect(left.senderId).toBe(other);
    expect(right.senderId).toBe(current);
    expect(left.pointId).toBe(segment.id);
    expect(right.pointId).toBe(segment.id);
  });

  it("associates messages with an event point", () => {
    const project = createProject("wechat");
    const point = addEventPoint(project, "灯光突然熄灭");
    const message = appendMessageToPoint(project, point.id, project.content.currentParticipantId);
    expect(point).toMatchObject({ kind: "event-divider", content: "灯光突然熄灭" });
    expect(message.pointId).toBe(point.id);
    expect(project.content.items.at(-1)?.id).toBe(message.id);
  });

  it("moves a message only within its own time segment", () => {
    const project = createProject("wechat");
    const messages = project.content.items.filter((item) => item.kind === "message");
    const first = messages[0];
    const second = messages[1];
    expect(first && second).toBeTruthy();
    if (!first || first.kind !== "message" || !second || second.kind !== "message") return;

    expect(moveMessageWithinPoint(project, second.id, "up")).toBe(true);
    const reordered = project.content.items.filter((item) => item.kind === "message" && item.pointId === first.pointId);
    expect(reordered.slice(0, 2).map((item) => item.id)).toEqual([second.id, first.id]);
    expect(moveMessageWithinPoint(project, second.id, "up")).toBe(false);
    const last = reordered.at(-1);
    expect(last && moveMessageWithinPoint(project, last.id, "down")).toBe(false);
  });
});
