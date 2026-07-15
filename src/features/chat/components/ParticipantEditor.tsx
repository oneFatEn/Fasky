import { useEffect, useRef } from "react";
import { ImageUploader, Switch } from "antd-mobile";
import { Plus, X } from "@phosphor-icons/react";
import type { Participant } from "../../../types";

interface ParticipantEditorProps {
  conversationTitle: string;
  showUsernames: boolean;
  participants: Participant[];
  assetUrls: Record<string, string>;
  onConversationTitleChange: (value: string) => void;
  onShowUsernamesChange: (value: boolean) => void;
  onParticipantChange: (participantId: string, patch: Partial<Participant>) => void;
  onAvatarUpload: (participantId: string, file: File) => Promise<boolean>;
  onAvatarRemove: (participantId: string) => void;
}

export function ParticipantEditor({
  conversationTitle,
  showUsernames,
  participants,
  assetUrls,
  onConversationTitleChange,
  onShowUsernamesChange,
  onParticipantChange,
  onAvatarUpload,
  onAvatarRemove,
}: ParticipantEditorProps) {
  const temporaryPreviewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = temporaryPreviewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  return (
    <div className="people-editor">
      <section className="people-settings">
        <label className="field full"><span>对话顶部名称</span><input value={conversationTitle} onChange={(event) => onConversationTitleChange(event.target.value)} /></label>
        <div className="toggle-row"><span><strong>显示用户名</strong><small>气泡上方展示发送者</small></span><Switch aria-label="显示用户名" checked={showUsernames} onChange={onShowUsernamesChange} /></div>
      </section>
      {participants.map((person, index) => (
        <section className="person-card" key={person.id}>
          <div className="person-card-title"><strong>{index === 0 ? "我方人物" : "对话人物"}</strong><small>{index === 0 ? "消息显示在右侧" : "消息显示在左侧"}</small></div>
          <label className="field"><span>用户名</span><input value={person.displayName} onChange={(event) => onParticipantChange(person.id, { displayName: event.target.value })} /></label>
          <div className="person-visual-settings">
            <div className="avatar-upload-field">
              <span>头像</span>
              <ImageUploader
                className="participant-avatar-uploader"
                value={person.avatarAssetId && assetUrls[person.avatarAssetId]
                  ? [{ key: person.avatarAssetId, url: assetUrls[person.avatarAssetId] }]
                  : undefined}
                defaultValue={[]}
                maxCount={1}
                accept="image/*"
                imageFit="cover"
                preview={false}
                deleteIcon={<X size={10} weight="bold" />}
                upload={async (file) => {
                  const uploaded = await onAvatarUpload(person.id, file);
                  if (!uploaded) throw new Error("头像上传失败");
                  const url = URL.createObjectURL(file);
                  temporaryPreviewUrls.current.add(url);
                  return { url };
                }}
                onDelete={() => onAvatarRemove(person.id)}
              >
                <span className="avatar-upload-button" aria-hidden="true"><Plus size={24} /></span>
              </ImageUploader>
            </div>
            <label className="color-field participant-color-field">
              <span>气泡颜色</span>
              <span className="color-control">
                <input type="color" value={person.bubbleColor} onChange={(event) => onParticipantChange(person.id, { bubbleColor: event.target.value })} />
                <strong>{person.bubbleColor.toUpperCase()}</strong>
              </span>
            </label>
          </div>
        </section>
      ))}
    </div>
  );
}
