import { describe, expect, it } from "vitest";
import { createProject } from "../../../defaultProject";
import { applyTemplate, insertChatItem, updateChatProject } from "./chatActions";
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
});
