import type { ChatItem, ChatProject, EventDividerItem, MessageItem, Participant, TemplateId, TimeDividerItem } from "../../../types";
import { CHAT_TEMPLATES } from "../../../templates";

export function updateChatProject(
  project: ChatProject,
  mutate: (draft: ChatProject) => void,
): ChatProject {
  const draft = structuredClone(project);
  mutate(draft);
  draft.updatedAt = new Date().toISOString();
  return draft;
}

export function findMessage(project: ChatProject, itemId: string): MessageItem | undefined {
  const item = project.content.items.find((entry) => entry.id === itemId);
  return item?.kind === "message" ? item : undefined;
}

export function findParticipant(project: ChatProject, participantId: string): Participant | undefined {
  return project.content.participants.find((participant) => participant.id === participantId);
}

export function insertChatItem(project: ChatProject, item: ChatItem, index: number): void {
  const safeIndex = Math.max(0, Math.min(index, project.content.items.length));
  project.content.items.splice(safeIndex, 0, item);
}

export function appendMessageToPoint(
  project: ChatProject,
  pointId: string,
  senderId: string,
): MessageItem {
  if (!project.content.participants.some((participant) => participant.id === senderId)) {
    throw new Error("消息发送者不存在");
  }
  const pointIndex = project.content.items.findIndex(
    (item) => item.kind !== "message" && item.id === pointId,
  );
  if (pointIndex < 0) throw new Error("时间或事件点不存在");
  const nextPointOffset = project.content.items.slice(pointIndex + 1).findIndex(
    (item) => item.kind !== "message",
  );
  const insertIndex = nextPointOffset < 0
    ? project.content.items.length
    : pointIndex + 1 + nextPointOffset;
  const message: MessageItem = {
    id: crypto.randomUUID(),
    kind: "message",
    senderId,
    pointId,
    messageType: "text",
    content: "",
  };
  project.content.items.splice(insertIndex, 0, message);
  return message;
}

export function addEventPoint(project: ChatProject, content: string): EventDividerItem {
  const item: EventDividerItem = {
    id: crypto.randomUUID(),
    kind: "event-divider",
    content: content.trim(),
  };
  if (!item.content) throw new Error("请输入事件内容");
  project.content.items.push(item);
  return item;
}

export function addTimeSegment(project: ChatProject, timestamp: string): TimeDividerItem {
  const item: TimeDividerItem = {
    id: crypto.randomUUID(),
    kind: "time-divider",
    timestamp,
  };
  project.content.items.push(item);
  return item;
}

export function moveMessageWithinPoint(
  project: ChatProject,
  messageId: string,
  direction: "up" | "down",
): boolean {
  const message = findMessage(project, messageId);
  if (!message) return false;

  const messageIndexes = project.content.items.flatMap((item, index) => (
    item.kind === "message" && item.pointId === message.pointId ? [index] : []
  ));
  const position = messageIndexes.findIndex((index) => project.content.items[index]?.id === messageId);
  const targetPosition = direction === "up" ? position - 1 : position + 1;
  if (position < 0 || targetPosition < 0 || targetPosition >= messageIndexes.length) return false;

  const sourceIndex = messageIndexes[position];
  const targetIndex = messageIndexes[targetPosition];
  [project.content.items[sourceIndex], project.content.items[targetIndex]] = [
    project.content.items[targetIndex],
    project.content.items[sourceIndex],
  ];
  return true;
}

export function applyTemplate(project: ChatProject, templateId: TemplateId): void {
  const tokens = CHAT_TEMPLATES[templateId];
  project.content.templateId = templateId;
  project.content.participants.forEach((participant) => {
    const isCurrent = participant.id === project.content.currentParticipantId;
    participant.bubbleColor = isCurrent ? tokens.ownBubble : tokens.otherBubble;
    participant.textColor = isCurrent ? tokens.ownText : tokens.otherText;
  });
}
