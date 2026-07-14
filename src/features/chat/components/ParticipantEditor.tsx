import type { Participant } from "../../../types";

interface ParticipantEditorProps {
  conversationTitle: string;
  showUsernames: boolean;
  participants: Participant[];
  onConversationTitleChange: (value: string) => void;
  onShowUsernamesChange: (value: boolean) => void;
  onParticipantChange: (participantId: string, patch: Partial<Participant>) => void;
  onAvatarUpload: (participantId: string, file?: File) => void;
}

export function ParticipantEditor({
  conversationTitle,
  showUsernames,
  participants,
  onConversationTitleChange,
  onShowUsernamesChange,
  onParticipantChange,
  onAvatarUpload,
}: ParticipantEditorProps) {
  return (
    <div className="people-editor">
      <label className="field full"><span>对话顶部名称</span><input value={conversationTitle} onChange={(event) => onConversationTitleChange(event.target.value)} /></label>
      <label className="toggle-row"><span><strong>显示用户名</strong><small>气泡上方展示发送者</small></span><input type="checkbox" checked={showUsernames} onChange={(event) => onShowUsernamesChange(event.target.checked)} /></label>
      {participants.map((person, index) => (
        <section className="person-card" key={person.id}>
          <div className="person-card-title"><span>{String(index + 1).padStart(2, "0")}</span><strong>{index === 0 ? "我方人物" : "对话人物"}</strong></div>
          <label className="field"><span>用户名</span><input value={person.displayName} onChange={(event) => onParticipantChange(person.id, { displayName: event.target.value })} /></label>
          <label className="upload-field compact"><span>头像</span><input type="file" accept="image/*" onChange={(event) => onAvatarUpload(person.id, event.target.files?.[0])} /><strong>{person.avatarAssetId ? "更换" : "上传"}</strong></label>
          <label className="color-field"><span>气泡颜色</span><input type="color" value={person.bubbleColor} onChange={(event) => onParticipantChange(person.id, { bubbleColor: event.target.value })} /></label>
        </section>
      ))}
    </div>
  );
}
