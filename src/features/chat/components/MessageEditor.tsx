import { useRef, useState } from "react";
import { ArrowsLeftRight, ChatCircle, Plus, Trash } from "@phosphor-icons/react";
import type { ChatItem, MessageItem, Participant } from "../../../types";
import { formatEditorTimestamp } from "../model/localDateTime";

interface MessageEditorProps {
  items: ChatItem[];
  participants: Participant[];
  currentParticipantId: string;
  assetUrls: Record<string, string>;
  onAddMessage: (timeSegmentId: string, senderId: string) => void;
  onChangeMessage: (id: string, patch: { senderId?: string; content?: string }) => void;
  onEditTime: (id: string) => void;
  onDelete: (id: string) => void;
}

interface MessageEditorRowProps {
  item: MessageItem;
  participants: Participant[];
  assetUrls: Record<string, string>;
  onChange: (patch: { senderId?: string; content?: string }) => void;
  onDelete: () => void;
}

const DELETE_REVEAL = 64;

function MessageEditorRow({ item, participants, assetUrls, onChange, onDelete }: MessageEditorRowProps) {
  const sender = participants.find((person) => person.id === item.senderId) ?? participants[0];
  const startX = useRef<number | null>(null);
  const startOffset = useRef(0);
  const [offset, setOffset] = useState(0);
  const imageUrl = sender?.avatarAssetId ? assetUrls[sender.avatarAssetId] : undefined;

  const switchSender = () => {
    const index = participants.findIndex((person) => person.id === item.senderId);
    const next = participants[(index + 1 + participants.length) % participants.length];
    if (next) onChange({ senderId: next.id });
  };

  return (
    <div className={`message-editor-swipe ${offset < 0 ? "is-revealed" : ""}`}>
      <button
        className="message-swipe-delete"
        onClick={onDelete}
        onFocus={() => setOffset(-DELETE_REVEAL)}
        aria-label="删除消息"
        type="button"
      >
        <span className="message-delete-icon" aria-hidden="true"><Trash size={18} weight="bold" /></span>
      </button>
      <div
        className="message-editor-row"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          startX.current = event.clientX;
          startOffset.current = offset;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          const distance = event.clientX - startX.current;
          setOffset(Math.max(-DELETE_REVEAL, Math.min(0, startOffset.current + distance)));
        }}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const distance = event.clientX - startX.current;
          setOffset(distance < -28 || offset < -DELETE_REVEAL / 2 ? -DELETE_REVEAL : 0);
          startX.current = null;
        }}
        onPointerCancel={() => {
          setOffset(offset < -DELETE_REVEAL / 2 ? -DELETE_REVEAL : 0);
          startX.current = null;
        }}
      >
        <button className="message-sender-switch" onClick={switchSender} aria-label={`切换发送者，当前为${sender?.displayName ?? "未知人物"}`} type="button">
          <span className="message-editor-avatar" aria-hidden="true">
            {imageUrl ? <img src={imageUrl} alt="" /> : sender?.displayName.slice(0, 1)}
          </span>
          <span className="sender-switch-icon" aria-hidden="true"><ArrowsLeftRight size={13} weight="bold" /></span>
        </button>
        <label className="message-content-field">
          <span className="sr-only">消息内容</span>
          <textarea
            value={item.content}
            rows={3}
            placeholder="输入消息"
            onChange={(event) => onChange({ content: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

export function MessageEditor({
  items,
  participants,
  currentParticipantId,
  assetUrls,
  onAddMessage,
  onChangeMessage,
  onEditTime,
  onDelete,
}: MessageEditorProps) {
  const current = participants.find((person) => person.id === currentParticipantId);
  const other = participants.find((person) => person.id !== currentParticipantId);

  return (
    <div className="content-editor">
      <div className="message-editor-list">
        {items.map((item) => item.kind === "time-divider" ? (
          <div className={`time-segment-editor ${item.requiresConfirmation ? "requires-confirmation" : ""}`} key={item.id}>
            <button
              className="segment-add segment-add-other"
              disabled={!other}
              onClick={() => other && onAddMessage(item.id, other.id)}
              aria-label={`在此时间段末尾新增${other?.displayName ?? "对话人物"}的气泡`}
              type="button"
            >
              <Plus size={16} weight="bold" />
              <span>对方</span>
            </button>
            <button className="segment-time" onClick={() => onEditTime(item.id)} type="button">
              <span>{formatEditorTimestamp(item.timestamp)}</span>
              {item.requiresConfirmation ? <small>原值：{item.legacyLabel}</small> : <small>点击修改日期时间</small>}
            </button>
            <button
              className="segment-add segment-add-current"
              disabled={!current}
              onClick={() => current && onAddMessage(item.id, current.id)}
              aria-label={`在此时间段末尾新增${current?.displayName ?? "我方人物"}的气泡`}
              type="button"
            >
              <Plus size={16} weight="bold" />
              <span>我方</span>
            </button>
            <button className="segment-delete" onClick={() => onDelete(item.id)} aria-label="删除时间段" type="button">
              <Trash size={16} />
            </button>
          </div>
        ) : (
          <MessageEditorRow
            item={item}
            participants={participants}
            assetUrls={assetUrls}
            onChange={(patch) => onChangeMessage(item.id, patch)}
            onDelete={() => onDelete(item.id)}
            key={item.id}
          />
        ))}
        {items.length === 0 ? (
          <div className="content-empty"><ChatCircle size={28} /><strong>还没有时间段</strong><span>先从顶部新增时间，再按左右人物添加气泡。</span></div>
        ) : null}
      </div>
    </div>
  );
}
