import {
  Trash,
} from "@phosphor-icons/react";
import { CHAT_TEMPLATES } from "../../templates";
import type { ChatItem, ChatProject } from "../../types";
import { ChatHeader, ChatStatusBar } from "./components/ChatHeader";
import { ChatInputBar } from "./components/ChatInputBar";
import { ChatItemBlock } from "./components/ChatItem";

export type CanvasMode = "editor" | "export" | "measure";

interface ChatCanvasProps {
  project: ChatProject;
  items?: ChatItem[];
  assetUrls: Record<string, string>;
  mode?: CanvasMode;
  onDelete?: (id: string) => void;
  oversizedId?: string;
}

export function ChatCanvas({
  project,
  items = project.content.items,
  assetUrls,
  mode = "editor",
  onDelete,
  oversizedId,
}: ChatCanvasProps) {
  const template = CHAT_TEMPLATES[project.content.templateId];
  const backgroundUrl = project.content.backgroundAssetId
    ? assetUrls[project.content.backgroundAssetId]
    : undefined;
  const dark = project.theme.appearance === "dark";

  return (
    <article
      className={`chat-phone template-${template.id} mode-${mode} ${dark ? "is-dark" : ""}`}
      style={{
        "--chat-background": backgroundUrl ? `url(${backgroundUrl})` : template.canvasBackground,
      } as React.CSSProperties}
      aria-label={`${template.name}聊天预览`}
    >
      <ChatStatusBar />
      <ChatHeader title={project.content.conversationTitle} />
      <div className="chat-stream">
        {items.map((item) => (
          <div
            className={`chat-item-wrap ${oversizedId === item.id ? "is-oversized" : ""}`}
            data-measure-id={mode === "measure" ? item.id : undefined}
            key={item.id}
          >
            <ChatItemBlock item={item} project={project} assetUrls={assetUrls} />
            {mode === "editor" && onDelete ? (
              <button
                className={`row-delete ${
                  item.kind === "time-divider"
                    ? "row-delete-divider"
                    : item.senderId === project.content.currentParticipantId
                      ? "row-delete-own"
                      : "row-delete-other"
                }`}
                aria-label="删除这一条"
                onClick={() => onDelete(item.id)}
                type="button"
              >
                <Trash size={8} weight="bold" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <ChatInputBar templateId={template.id} />
    </article>
  );
}
