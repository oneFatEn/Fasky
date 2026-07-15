import { describe, expect, it } from "vitest";
import { createProject } from "../../defaultProject";
import type { MessageItem } from "../../types";
import { describeOversizedMessage, validateExportProject } from "./exportValidation";

function firstMessage(project: ReturnType<typeof createProject>): MessageItem {
  const message = project.content.items.find((item): item is MessageItem => item.kind === "message");
  if (!message) throw new Error("测试项目缺少消息");
  return message;
}

describe("validateExportProject", () => {
  it.each(["wechat", "whatsapp"] as const)("accepts a valid %s project", (templateId) => {
    const project = createProject(templateId);
    expect(validateExportProject(project)).toHaveLength(3);
  });

  it("requires an actual message rather than accepting a divider-only document", () => {
    const project = createProject("wechat");
    project.content.items = project.content.items.filter((item) => item.kind !== "message");
    expect(() => validateExportProject(project)).toThrow("至少添加一条消息");
  });

  it("rejects unresolved legacy time points", () => {
    const project = createProject("wechat");
    const divider = project.content.items[0];
    if (divider.kind !== "time-divider") throw new Error("测试项目缺少时间点");
    divider.timestamp = null;
    divider.requiresConfirmation = true;
    expect(() => validateExportProject(project)).toThrow("确认所有旧时间段");
  });

  it("identifies a message whose sender no longer exists", () => {
    const project = createProject("whatsapp");
    const message = firstMessage(project);
    message.senderId = "missing-participant";
    expect(() => validateExportProject(project)).toThrow(`消息 ${message.id} 的发送者不存在`);
  });

  it("identifies a message whose point no longer exists", () => {
    const project = createProject("whatsapp");
    const message = firstMessage(project);
    message.pointId = "missing-point";
    expect(() => validateExportProject(project)).toThrow(`消息 ${message.id} 未关联时间或事件点`);
  });
});

describe("describeOversizedMessage", () => {
  it("locates the message and gives an actionable split instruction", () => {
    const project = createProject("wechat");
    const message = firstMessage(project);
    message.content = "这是一段非常非常长而且需要拆开的测试消息内容";
    expect(describeOversizedMessage(project, message.id)).toBe(
      "第 1 条消息“这是一段非常非常长而且需要拆开的测试…”超过一页可用高度，请拆成多条消息后再导出",
    );
  });
});
