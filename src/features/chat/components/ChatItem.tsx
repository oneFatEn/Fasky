import { Checks } from "@phosphor-icons/react";
import type { ChatItem, ChatProject, MessageItem, Participant } from "../../../types";
import { formatTimeOfDay, formatTimeSegment } from "../model/localDateTime";

function Avatar({ participant, assetUrls }: { participant: Participant; assetUrls: Record<string, string> }) {
  const imageUrl = participant.avatarAssetId ? assetUrls[participant.avatarAssetId] : undefined;
  return (
    <span className="chat-avatar" aria-label={`${participant.displayName}的头像`}>
      {imageUrl ? <img src={imageUrl} alt="" /> : participant.displayName.slice(0, 1)}
    </span>
  );
}

function MessageBlock({ item, project, assetUrls }: { item: MessageItem; project: ChatProject; assetUrls: Record<string, string> }) {
  const participant = project.content.participants.find((person) => person.id === item.senderId);
  if (!participant) return null;
  const own = participant.id === project.content.currentParticipantId;
  const segment = project.content.items.find(
    (entry) => entry.kind === "time-divider" && entry.id === item.timeSegmentId,
  );
  const time = segment?.kind === "time-divider" ? formatTimeOfDay(segment.timestamp) : undefined;

  return (
    <div className={`chat-message ${own ? "is-own" : "is-other"}`}>
      {!own ? <Avatar participant={participant} assetUrls={assetUrls} /> : null}
      <div className="bubble-stack">
        {project.content.showUsernames ? <span className="message-name">{participant.displayName}</span> : null}
        <div className="message-bubble" style={{ backgroundColor: participant.bubbleColor, color: participant.textColor }}>
          <span className="message-content">{item.content}</span>
          {time ? (
            <span className="message-meta">
              <span className="message-time">{time}</span>
              {project.content.templateId === "whatsapp" ? (
                <Checks className="message-status" size={10} weight="bold" aria-label="已读" />
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
      {own ? <Avatar participant={participant} assetUrls={assetUrls} /> : null}
    </div>
  );
}

export function ChatItemBlock({ item, project, assetUrls }: { item: ChatItem; project: ChatProject; assetUrls: Record<string, string> }) {
  if (item.kind === "time-divider") return <div className="time-divider">{formatTimeSegment(item.timestamp, project.content.referenceDate)}</div>;
  return <MessageBlock item={item} project={project} assetUrls={assetUrls} />;
}
