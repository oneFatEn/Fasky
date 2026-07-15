import { Checks } from "@phosphor-icons/react";
import { Avatar } from "antd-mobile";
import type { ChatItem, ChatProject, MessageItem, Participant } from "../../../types";
import { formatTimeOfDay, formatTimeSegment } from "../model/localDateTime";

function ParticipantAvatar({ participant, assetUrls }: { participant: Participant; assetUrls: Record<string, string> }) {
  const imageUrl = participant.avatarAssetId ? assetUrls[participant.avatarAssetId] : undefined;
  return (
    <Avatar
      className="chat-avatar"
      src={imageUrl ?? ""}
      fallback={<span className="avatar-initial">{participant.displayName.slice(0, 1)}</span>}
      alt={`${participant.displayName}的头像`}
      style={{ "--size": "36px", "--border-radius": "50%" }}
    />
  );
}

function MessageBlock({ item, project, assetUrls }: { item: MessageItem; project: ChatProject; assetUrls: Record<string, string> }) {
  const participant = project.content.participants.find((person) => person.id === item.senderId);
  if (!participant) return null;
  const own = participant.id === project.content.currentParticipantId;
  const point = project.content.items.find(
    (entry) => entry.kind !== "message" && entry.id === item.pointId,
  );
  const time = point?.kind === "time-divider" ? formatTimeOfDay(point.timestamp) : undefined;

  return (
    <div className={`chat-message ${own ? "is-own" : "is-other"}`}>
      {!own ? <ParticipantAvatar participant={participant} assetUrls={assetUrls} /> : null}
      <div className="bubble-stack">
        {project.content.showUsernames ? <span className="message-name">{participant.displayName}</span> : null}
        <div className="message-bubble" style={{ backgroundColor: participant.bubbleColor, color: participant.textColor }}>
          <span className="message-content">{item.content}</span>
          {time && project.content.templateId === "whatsapp" ? (
            <span className="message-meta">
              <span className="message-time">{time}</span>
              <Checks className="message-status" size={10} weight="bold" aria-label="已读" />
            </span>
          ) : null}
        </div>
      </div>
      {own ? <ParticipantAvatar participant={participant} assetUrls={assetUrls} /> : null}
    </div>
  );
}

export function ChatItemBlock({ item, project, assetUrls }: { item: ChatItem; project: ChatProject; assetUrls: Record<string, string> }) {
  if (item.kind === "time-divider") return <div className="time-divider">{formatTimeSegment(item.timestamp, project.content.referenceDate)}</div>;
  if (item.kind === "event-divider") return <div className="event-divider">{item.content}</div>;
  return <MessageBlock item={item} project={project} assetUrls={assetUrls} />;
}
