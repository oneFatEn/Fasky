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
      <div className="panel-heading"><div><span>聊天模板</span><small>切换会同步默认气泡色</small></div></div>
      <div className="template-switch">
        {(Object.keys(CHAT_TEMPLATES) as TemplateId[]).map((id) => (
          <button className={templateId === id ? "active" : ""} onClick={() => onTemplateChange(id)} type="button" key={id}>{CHAT_TEMPLATES[id].name}</button>
        ))}
      </div>
      <label className="upload-field"><span>聊天背景</span><input type="file" accept="image/*" onChange={(event) => onBackgroundUpload(event.target.files?.[0])} /><strong>{hasBackground ? "更换图片" : "上传图片"}</strong></label>
      {hasBackground ? <button className="text-button danger" onClick={onBackgroundRemove} type="button">移除聊天背景</button> : null}
    </div>
  );
}
