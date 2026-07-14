import type { ChatItem, ChatProject, MessageItem, Participant } from "../../../types";

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

  return (
    <div className={`chat-message ${own ? "is-own" : "is-other"}`}>
      {!own ? <Avatar participant={participant} assetUrls={assetUrls} /> : null}
      <div className="bubble-stack">
        {project.content.showUsernames ? <span className="message-name">{participant.displayName}</span> : null}
        <div className="message-bubble" style={{ backgroundColor: participant.bubbleColor, color: participant.textColor }}>
          {item.content || "空消息"}
          {project.content.templateId === "whatsapp" ? <span className="message-time">16:28 ✓✓</span> : null}
        </div>
      </div>
      {own ? <Avatar participant={participant} assetUrls={assetUrls} /> : null}
    </div>
  );
}

export function ChatItemBlock({ item, project, assetUrls }: { item: ChatItem; project: ChatProject; assetUrls: Record<string, string> }) {
  if (item.kind === "time-divider") return <div className="time-divider">{item.label}</div>;
  return <MessageBlock item={item} project={project} assetUrls={assetUrls} />;
}
