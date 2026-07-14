import { ChatCircle, Plus, Trash } from "@phosphor-icons/react";
import type { ChatItem, Participant } from "../../../types";
import { formatEditorTimestamp } from "../model/localDateTime";

interface MessageEditorProps {
  items: ChatItem[];
  participants: Participant[];
  currentParticipantId: string;
  onAddMessage: (timeSegmentId: string, senderId: string) => void;
  onChangeMessage: (id: string, patch: { senderId?: string; content?: string }) => void;
  onEditTime: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MessageEditor({
  items,
  participants,
  currentParticipantId,
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
        {items.map((item, index) => item.kind === "time-divider" ? (
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
          <div className="message-editor-row" key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <select value={item.senderId} onChange={(event) => onChangeMessage(item.id, { senderId: event.target.value })} aria-label="消息发送者">
              {participants.map((person) => <option value={person.id} key={person.id}>{person.displayName}</option>)}
            </select>
            <label className="message-content-field">
              <span>消息内容</span>
              <textarea
                value={item.content}
                rows={2}
                placeholder="输入消息"
                onChange={(event) => onChangeMessage(item.id, { content: event.target.value })}
              />
            </label>
            <button onClick={() => onDelete(item.id)} aria-label="删除消息" type="button"><Trash size={15} /></button>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="content-empty"><ChatCircle size={28} /><strong>还没有时间段</strong><span>先从顶部新增时间，再按左右人物添加气泡。</span></div>
        ) : null}
      </div>
    </div>
  );
}
