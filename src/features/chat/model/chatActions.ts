import type { ChatItem, ChatProject, MessageItem, Participant, TemplateId } from "../../../types";
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

export function applyTemplate(project: ChatProject, templateId: TemplateId): void {
  const tokens = CHAT_TEMPLATES[templateId];
  project.content.templateId = templateId;
  project.content.participants.forEach((participant) => {
    const isCurrent = participant.id === project.content.currentParticipantId;
    participant.bubbleColor = isCurrent ? tokens.ownBubble : tokens.otherBubble;
    participant.textColor = isCurrent ? tokens.ownText : tokens.otherText;
  });
}
