import type { ChatItem, ChatProject, EventDividerItem, MessageItem, TimeDividerItem } from "../../../types";
import { formatLocalDate, parseLocalDate, parseLocalDateTime } from "./localDateTime";

export const CHAT_SCHEMA_VERSION = 5;

type LegacyTimeDivider = Omit<TimeDividerItem, "timestamp"> & { label?: string; timestamp?: string | null };
type LegacyMessage = Omit<MessageItem, "pointId"> & { pointId?: string; timeSegmentId?: string; timestamp?: string };
type LegacyItem = LegacyTimeDivider | EventDividerItem | LegacyMessage;
type LegacyProject = Omit<ChatProject, "content"> & {
  content: Omit<ChatProject["content"], "referenceDate" | "items"> & {
    referenceTimestamp?: string;
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
  const updatedAt = new Date(draft.updatedAt);
  const fallbackReferenceDate = formatLocalDate(Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt);
  const storedReferenceDate = parseLocalDate(draft.content.referenceDate ?? "");
  const legacyReferenceTimestamp = parseLocalDateTime(draft.content.referenceTimestamp ?? null);
  const referenceDate = storedReferenceDate
    ? formatLocalDate(storedReferenceDate)
    : legacyReferenceTimestamp
      ? formatLocalDate(legacyReferenceTimestamp)
      : fallbackReferenceDate;

  const migratedItems: ChatItem[] = [];
  let currentPointId: string | undefined;
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
      currentPointId = divider.id;
      continue;
    }

    if (item.kind === "event-divider") {
      migratedItems.push(item as ChatItem);
      currentPointId = item.id;
      continue;
    }

    if (!currentPointId) {
      const divider = makeUnresolvedDivider();
      migratedItems.push(divider);
      currentPointId = divider.id;
    }
    const { timestamp: _discardedMessageTimestamp, timeSegmentId: _legacyPointId, ...message } = item;
    migratedItems.push({
      ...message,
      pointId: item.pointId ?? item.timeSegmentId ?? currentPointId,
    });
  }

  const migratedContent = { ...draft.content } as Record<string, unknown>;
  delete migratedContent.referenceDate;
  delete migratedContent.referenceTimestamp;
  delete migratedContent.items;

  return {
    ...draft,
    schemaVersion: CHAT_SCHEMA_VERSION,
    content: {
      ...migratedContent,
      referenceDate,
      items: migratedItems,
    },
  } as ChatProject;
}

export function hasUnresolvedTimeSegments(project: ChatProject): boolean {
  return project.content.items.some((item) => item.kind === "time-divider" && !item.timestamp);
}
