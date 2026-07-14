import type { ChatItem, ChatProject, MessageItem, TimeDividerItem } from "../../../types";
import { formatLocalDate, parseLocalDateTime } from "./localDateTime";

export const CHAT_SCHEMA_VERSION = 2;

type LegacyTimeDivider = Omit<TimeDividerItem, "timestamp"> & { label?: string; timestamp?: string | null };
type LegacyMessage = Omit<MessageItem, "timeSegmentId"> & { timeSegmentId?: string };
type LegacyItem = LegacyTimeDivider | LegacyMessage;
type LegacyProject = Omit<ChatProject, "content"> & {
  content: Omit<ChatProject["content"], "referenceDate" | "items"> & {
    referenceDate?: string;
    items: LegacyItem[];
  };
};

function parseLegacyTimestamp(label?: string): string | null {
  if (!label) return null;
  const normalized = label.match(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}$/)
    ? `${label.slice(0, 10)}T${label.slice(11, 13)}:${label.slice(14, 16)}`
    : label.replace(" ", "T");
  return parseLocalDateTime(normalized) ? normalized : null;
}

function makeUnresolvedDivider(label = "旧消息时间待确认"): TimeDividerItem {
  return {
    id: crypto.randomUUID(),
    kind: "time-divider",
    timestamp: null,
    legacyLabel: label,
    requiresConfirmation: true,
  };
}

export function migrateChatProject(project: ChatProject | LegacyProject): ChatProject {
  const draft = structuredClone(project) as LegacyProject;
  const fallbackReferenceDate = formatLocalDate(new Date(draft.updatedAt));
  draft.content.referenceDate = draft.content.referenceDate ?? fallbackReferenceDate;

  const migratedItems: ChatItem[] = [];
  let currentSegmentId: string | undefined;
  for (const item of draft.content.items) {
    if (item.kind === "time-divider") {
      const timestamp = parseLocalDateTime(item.timestamp ?? null)
        ? item.timestamp ?? null
        : parseLegacyTimestamp(item.label);
      const divider: TimeDividerItem = {
        id: item.id,
        kind: "time-divider",
        timestamp,
        ...(timestamp ? {} : {
          legacyLabel: item.legacyLabel ?? item.label ?? "旧时间无法识别",
          requiresConfirmation: true as const,
        }),
      };
      migratedItems.push(divider);
      currentSegmentId = divider.id;
      continue;
    }

    if (!currentSegmentId) {
      const divider = makeUnresolvedDivider();
      migratedItems.push(divider);
      currentSegmentId = divider.id;
    }
    migratedItems.push({ ...item, timeSegmentId: item.timeSegmentId ?? currentSegmentId });
  }

  return {
    ...draft,
    schemaVersion: CHAT_SCHEMA_VERSION,
    content: {
      ...draft.content,
      referenceDate: draft.content.referenceDate,
      items: migratedItems,
    },
  } as ChatProject;
}

export function hasUnresolvedTimeSegments(project: ChatProject): boolean {
  return project.content.items.some((item) => item.kind === "time-divider" && !item.timestamp);
}
