import { Camera, Microphone, PlusCircle, Smiley } from "@phosphor-icons/react";
import type { TemplateId } from "../../../types";

export function ChatInputBar({ templateId }: { templateId: TemplateId }) {
  return (
    <footer className="conversation-input">
      {templateId === "wechat" ? <Microphone size={21} /> : <Smiley size={22} />}
      <span>输入消息</span>
      <Smiley size={21} />
      {templateId === "wechat" ? <PlusCircle size={22} /> : <Camera size={22} />}
    </footer>
  );
}
