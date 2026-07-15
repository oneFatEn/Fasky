import type { ChatProject, MessageItem } from "../../types";
import { hasUnresolvedTimeSegments } from "../chat/model/chatMigration";

export function validateExportProject(project: ChatProject): MessageItem[] {
  const messages = project.content.items.filter(
    (item): item is MessageItem => item.kind === "message",
  );
  if (messages.length === 0) throw new Error("至少添加一条消息后再导出");
  if (hasUnresolvedTimeSegments(project)) {
    throw new Error("请先确认所有旧时间段的日期时间再导出");
  }

  const participantIds = new Set(project.content.participants.map((participant) => participant.id));
  const invalidSender = messages.find((message) => !participantIds.has(message.senderId));
  if (invalidSender) {
    throw new Error(`消息 ${invalidSender.id} 的发送者不存在，请重新选择发送者后再导出`);
  }

  const pointIds = new Set(
    project.content.items
      .filter((item) => item.kind !== "message")
      .map((item) => item.id),
  );
  const invalidPoint = messages.find((message) => !pointIds.has(message.pointId));
  if (invalidPoint) {
    throw new Error(`消息 ${invalidPoint.id} 未关联时间或事件点，请重新编辑后再导出`);
  }

  return messages;
}

export function describeOversizedMessage(project: ChatProject, itemId: string): string {
  const messages = project.content.items.filter(
    (item): item is MessageItem => item.kind === "message",
  );
  const index = messages.findIndex((message) => message.id === itemId);
  const message = messages[index];
  if (!message) return "单条内容超过一页可用高度，请拆分后再导出";
  const normalized = message.content.replace(/\s+/g, " ").trim();
  const preview = normalized.length > 18 ? `${normalized.slice(0, 18)}…` : normalized;
  return `第 ${index + 1} 条消息${preview ? `“${preview}”` : ""}超过一页可用高度，请拆成多条消息后再导出`;
}
