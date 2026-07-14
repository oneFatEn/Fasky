import type { ChatItem, ChatProject, MessageItem, Participant, TemplateId, TimeDividerItem } from "../../../types";
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

export function appendMessageToTimeSegment(
  project: ChatProject,
  timeSegmentId: string,
  senderId: string,
): MessageItem {
  if (!project.content.participants.some((participant) => participant.id === senderId)) {
    throw new Error("消息发送者不存在");
  }
  const segmentIndex = project.content.items.findIndex(
    (item) => item.kind === "time-divider" && item.id === timeSegmentId,
  );
  if (segmentIndex < 0) throw new Error("时间段不存在");
  const nextSegmentOffset = project.content.items.slice(segmentIndex + 1).findIndex(
    (item) => item.kind === "time-divider",
  );
  const insertIndex = nextSegmentOffset < 0
    ? project.content.items.length
    : segmentIndex + 1 + nextSegmentOffset;
  const message: MessageItem = {
    id: crypto.randomUUID(),
    kind: "message",
    senderId,
    timeSegmentId,
    messageType: "text",
    content: "",
  };
  project.content.items.splice(insertIndex, 0, message);
  return message;
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

export function applyTemplate(project: ChatProject, templateId: TemplateId): void {
  const tokens = CHAT_TEMPLATES[templateId];
  project.content.templateId = templateId;
  project.content.participants.forEach((participant) => {
    const isCurrent = participant.id === project.content.currentParticipantId;
    participant.bubbleColor = isCurrent ? tokens.ownBubble : tokens.otherBubble;
    participant.textColor = isCurrent ? tokens.ownText : tokens.otherText;
  });
}
