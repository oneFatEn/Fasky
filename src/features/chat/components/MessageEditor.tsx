import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowsLeftRight, ChatCircle, Plus, Trash } from "@phosphor-icons/react";
import { Avatar, Picker, SwipeAction } from "antd-mobile";
import type { SwipeActionRef } from "antd-mobile";
import type { ChatItem, MessageItem, Participant } from "../../../types";
import { formatEditorTimestamp } from "../model/localDateTime";

interface MessageEditorProps {
  items: ChatItem[];
  participants: Participant[];
  currentParticipantId: string;
  assetUrls: Record<string, string>;
  onAddMessage: (pointId: string, senderId: string) => void;
  onChangeMessage: (id: string, patch: { senderId?: string; content?: string }) => void;
  onEditTime: (id: string) => void;
  onEditEvent: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveMessage: (id: string, direction: "up" | "down") => void;
}

interface MessageEditorRowProps {
  item: MessageItem;
  participants: Participant[];
  assetUrls: Record<string, string>;
  onChange: (patch: { senderId?: string; content?: string }) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function SwipeIcon({ label, tone, children }: { label: string; tone: "neutral" | "danger"; children: React.ReactNode }) {
  return <span className={`swipe-action-icon is-${tone}`}>{children}<span className="sr-only">{label}</span></span>;
}

function MessageEditorRow({ item, participants, assetUrls, onChange, onDelete, onMoveUp, onMoveDown }: MessageEditorRowProps) {
  const swipeRef = useRef<SwipeActionRef>(null);
  const sender = participants.find((person) => person.id === item.senderId) ?? participants[0];
  const imageUrl = sender?.avatarAssetId ? assetUrls[sender.avatarAssetId] : undefined;

  const senderOptions = participants.map((person) => ({
    label: person.displayName,
    value: person.id,
  }));

  const closeThenMove = (move: () => void) => {
    swipeRef.current?.close();
    window.requestAnimationFrame(move);
  };

  const actions = [
    ...(onMoveUp ? [{
      key: "move-up",
      color: "var(--surface)",
      text: <SwipeIcon label="上移消息" tone="neutral"><ArrowUp size={18} weight="bold" /></SwipeIcon>,
      onClick: () => closeThenMove(onMoveUp),
    }] : []),
    ...(onMoveDown ? [{
      key: "move-down",
      color: "var(--surface)",
      text: <SwipeIcon label="下移消息" tone="neutral"><ArrowDown size={18} weight="bold" /></SwipeIcon>,
      onClick: () => closeThenMove(onMoveDown),
    }] : []),
    {
      key: "delete",
      color: "var(--surface)",
      text: <SwipeIcon label="删除消息" tone="danger"><Trash size={18} weight="bold" /></SwipeIcon>,
      onClick: onDelete,
    },
  ];

  return (
    <SwipeAction ref={swipeRef} className="editor-swipe-action" rightActions={actions} closeOnAction>
      <div className="message-editor-row">
        <Picker
          columns={[senderOptions]}
          value={[item.senderId]}
          title="选择消息发送者"
          closeOnMaskClick
          popupClassName="sender-picker-popup"
          style={{ "--item-height": "48px", "--item-font-size": "16px" }}
          onConfirm={(value) => {
            const senderId = value[0];
            if (typeof senderId === "string") onChange({ senderId });
          }}
          renderLabel={(option) => {
            const person = participants.find((participant) => participant.id === option.value);
            const avatarUrl = person?.avatarAssetId ? assetUrls[person.avatarAssetId] : undefined;
            return (
              <span className={`sender-picker-option ${avatarUrl ? "has-avatar" : "without-avatar"}`}>
                {avatarUrl ? (
                  <Avatar
                    src={avatarUrl}
                    alt=""
                    style={{ "--size": "32px", "--border-radius": "50%" }}
                  />
                ) : null}
                <span className="sender-picker-name">{person?.displayName ?? option.label}</span>
              </span>
            );
          }}
        >
          {(_, actions) => (
            <button className="message-sender-switch" onClick={actions.open} aria-label={`选择发送者，当前为${sender?.displayName ?? "未知人物"}`} type="button">
              <Avatar
                className="message-editor-avatar"
                src={imageUrl ?? ""}
                fallback={<span className="avatar-initial">{sender?.displayName.slice(0, 1)}</span>}
                alt=""
                style={{ "--size": "48px", "--border-radius": "50%" }}
              />
              <span className="sender-switch-icon" aria-hidden="true"><ArrowsLeftRight size={13} weight="bold" /></span>
            </button>
          )}
        </Picker>
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
    </SwipeAction>
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
  onEditEvent,
  onDelete,
  onMoveMessage,
}: MessageEditorProps) {
  const [swipeRevision, setSwipeRevision] = useState(0);
  const current = participants.find((person) => person.id === currentParticipantId);
  const other = participants.find((person) => person.id !== currentParticipantId);
  const moveMessageAndResetSwipe = (id: string, direction: "up" | "down") => {
    onMoveMessage(id, direction);
    setSwipeRevision((revision) => revision + 1);
  };

  return (
    <div className="content-editor">
      <div className="message-editor-list">
        {items.map((item) => item.kind !== "message" ? (
          <SwipeAction
            className="editor-swipe-action time-segment-swipe"
            rightActions={[{
              key: "delete",
              color: "var(--surface)",
              text: <SwipeIcon label={`删除${item.kind === "time-divider" ? "时间点" : "事件点"}`} tone="danger"><Trash size={18} weight="bold" /></SwipeIcon>,
              onClick: () => onDelete(item.id),
            }]}
            key={item.id}
          >
          <div className={`time-segment-editor ${item.kind === "time-divider" && item.requiresConfirmation ? "requires-confirmation" : ""}`}>
            <button
              className="segment-add segment-add-other"
              disabled={!other}
              onClick={() => other && onAddMessage(item.id, other.id)}
              aria-label={`在此点末尾新增${other?.displayName ?? "对话人物"}的气泡`}
              type="button"
            >
              <Plus size={16} weight="bold" />
              <span>对方</span>
            </button>
            <button className={`segment-time ${item.kind === "event-divider" ? "is-event" : ""}`} onClick={() => item.kind === "time-divider" ? onEditTime(item.id) : onEditEvent(item.id)} type="button">
              <span>{item.kind === "time-divider" ? formatEditorTimestamp(item.timestamp) : item.content}</span>
              {item.kind === "time-divider" && item.requiresConfirmation ? <small>原值：{item.legacyLabel}</small> : <small>{item.kind === "time-divider" ? "点击修改日期时间" : "事件点，点击修改"}</small>}
            </button>
            <button
              className="segment-add segment-add-current"
              disabled={!current}
              onClick={() => current && onAddMessage(item.id, current.id)}
              aria-label={`在此点末尾新增${current?.displayName ?? "我方人物"}的气泡`}
              type="button"
            >
              <Plus size={16} weight="bold" />
              <span>我方</span>
            </button>
          </div>
          </SwipeAction>
        ) : (
          (() => {
            const pointMessages = items.filter((entry): entry is MessageItem => entry.kind === "message" && entry.pointId === item.pointId);
            const position = pointMessages.findIndex((entry) => entry.id === item.id);
            return <MessageEditorRow
              item={item}
              participants={participants}
              assetUrls={assetUrls}
              onChange={(patch) => onChangeMessage(item.id, patch)}
              onDelete={() => onDelete(item.id)}
              onMoveUp={position > 0 ? () => moveMessageAndResetSwipe(item.id, "up") : undefined}
              onMoveDown={position >= 0 && position < pointMessages.length - 1 ? () => moveMessageAndResetSwipe(item.id, "down") : undefined}
              key={`${item.id}-${swipeRevision}`}
            />;
          })()
        ))}
        {items.length === 0 ? (
          <div className="content-empty"><ChatCircle size={28} /><strong>还没有时间或事件点</strong><span>先从顶部新增一个点，再按左右人物添加气泡。</span></div>
        ) : null}
      </div>
    </div>
  );
}
