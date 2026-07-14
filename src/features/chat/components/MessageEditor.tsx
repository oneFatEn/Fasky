import { Trash } from "@phosphor-icons/react";
import type { ChatItem, Participant } from "../../../types";

interface MessageEditorProps {
  items: ChatItem[];
  participants: Participant[];
  onAddTime: () => void;
  onChangeMessage: (id: string, patch: { senderId?: string; content?: string }) => void;
  onChangeTime: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

export function MessageEditor({
  items,
  participants,
  onAddTime,
  onChangeMessage,
  onChangeTime,
  onDelete,
}: MessageEditorProps) {
  return (
    <div className="content-editor">
      <div className="panel-heading">
        <div><span>对话顺序</span><small>{items.length} 条内容</small></div>
        <button onClick={onAddTime} type="button">+ 时间</button>
      </div>
      <div className="message-editor-list">
        {items.map((item, index) => item.kind === "time-divider" ? (
          <div className="time-editor-row" key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <input aria-label="时间文字" value={item.label} onChange={(event) => onChangeTime(item.id, event.target.value)} />
            <button onClick={() => onDelete(item.id)} aria-label="删除时间" type="button"><Trash size={15} /></button>
          </div>
        ) : (
          <div className="message-editor-row" key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <select value={item.senderId} onChange={(event) => onChangeMessage(item.id, { senderId: event.target.value })} aria-label="消息发送者">
              {participants.map((person) => <option value={person.id} key={person.id}>{person.displayName}</option>)}
            </select>
            <textarea value={item.content} rows={2} onChange={(event) => onChangeMessage(item.id, { content: event.target.value })} aria-label="消息内容" />
            <button onClick={() => onDelete(item.id)} aria-label="删除消息" type="button"><Trash size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
