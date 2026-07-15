import { ImageSquare } from "@phosphor-icons/react";
import { Segmented } from "antd-mobile";
import { CHAT_TEMPLATES } from "../../../templates";
import type { TemplateId } from "../../../types";

interface ChatStyleEditorProps {
  templateId: TemplateId;
  hasBackground: boolean;
  onTemplateChange: (templateId: TemplateId) => void;
  onBackgroundUpload: (file?: File) => void;
  onBackgroundRemove: () => void;
}

export function ChatStyleEditor({
  templateId,
  hasBackground,
  onTemplateChange,
  onBackgroundUpload,
  onBackgroundRemove,
}: ChatStyleEditorProps) {
  return (
    <div className="style-editor">
      <section className="editor-setting-group">
        <div className="setting-group-heading"><div><strong>聊天模板</strong><small>切换后同步模板的默认气泡颜色</small></div></div>
        <Segmented
          className="editor-segmented"
          block
          value={templateId}
          options={(Object.keys(CHAT_TEMPLATES) as TemplateId[]).map((id) => ({ label: CHAT_TEMPLATES[id].name, value: id }))}
          onChange={(value) => onTemplateChange(value as TemplateId)}
        />
      </section>
      <section className="editor-setting-group">
        <div className="setting-group-heading"><div><strong>聊天背景</strong><small>图片只应用于当前作品</small></div></div>
        <label className="background-upload-control">
          <input type="file" accept="image/*" onChange={(event) => onBackgroundUpload(event.target.files?.[0])} />
          <ImageSquare size={20} />
          <span>{hasBackground ? "更换背景图片" : "上传背景图片"}</span>
        </label>
        {hasBackground ? <button className="text-button danger" onClick={onBackgroundRemove} type="button">移除聊天背景</button> : null}
      </section>
    </div>
  );
}
