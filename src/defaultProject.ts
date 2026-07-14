import { CHAT_TEMPLATES, EXPORT_HEIGHT, EXPORT_PIXEL_RATIO, EXPORT_WIDTH } from "./templates";
import type { ChatProject, TemplateId } from "./types";
import { CHAT_SCHEMA_VERSION } from "./features/chat/model/chatMigration";
import { formatLocalDate, formatLocalDateTime } from "./features/chat/model/localDateTime";

const makeId = () => crypto.randomUUID();

export function createProject(templateId: TemplateId): ChatProject {
  const createdAt = new Date().toISOString();
  const template = CHAT_TEMPLATES[templateId];
  const currentParticipantId = makeId();
  const otherParticipantId = makeId();
  const timeSegmentId = makeId();
  const referenceDate = formatLocalDate(new Date());
  const timestamp = formatLocalDateTime(new Date(`${referenceDate}T16:28`));

  return {
    id: makeId(),
    schemaVersion: CHAT_SCHEMA_VERSION,
    type: "chat",
    title: "周末逃跑计划",
    createdAt,
    updatedAt: createdAt,
    content: {
      templateId,
      conversationTitle: "乔屿",
      currentParticipantId,
      referenceDate,
      showUsernames: false,
      participants: [
        {
          id: currentParticipantId,
          displayName: "林澄",
          bubbleColor: template.ownBubble,
          textColor: template.ownText,
        },
        {
          id: otherParticipantId,
          displayName: "乔屿",
          bubbleColor: template.otherBubble,
          textColor: template.otherText,
        },
      ],
      items: [
        { id: timeSegmentId, kind: "time-divider", timestamp },
        {
          id: makeId(),
          kind: "message",
          senderId: otherParticipantId,
          timeSegmentId,
          messageType: "text",
          content: "我找到一家离海很近的民宿，窗户推开就是风。",
        },
        {
          id: makeId(),
          kind: "message",
          senderId: currentParticipantId,
          timeSegmentId,
          messageType: "text",
          content: "订。周五下班直接走。",
        },
        {
          id: makeId(),
          kind: "message",
          senderId: otherParticipantId,
          timeSegmentId,
          messageType: "text",
          content: "我带相机。",
        },
      ],
    },
    theme: { appearance: "light" },
    export: {
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: EXPORT_PIXEL_RATIO,
    },
  };
}
