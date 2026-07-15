import { Moon, Sun } from "@phosphor-icons/react";
import { Segmented } from "antd-mobile";
import type { Appearance } from "../../../types";

interface CanvasEditorProps {
  appearance: Appearance;
  pageEstimate: number;
  onAppearanceChange: (appearance: Appearance) => void;
}

export function CanvasEditor({ appearance, pageEstimate, onAppearanceChange }: CanvasEditorProps) {
  return (
    <div className="canvas-editor">
      <section className="editor-setting-group">
        <div className="setting-group-heading"><div><strong>显示模式</strong><small>预览与导出使用相同主题</small></div></div>
        <Segmented
          className="editor-segmented"
          block
          value={appearance}
          options={[
            { label: "浅色", value: "light", icon: <Sun size={17} /> },
            { label: "深色", value: "dark", icon: <Moon size={17} /> },
          ]}
          onChange={(value) => onAppearanceChange(value as Appearance)}
        />
      </section>
      <section className="editor-setting-group">
        <div className="setting-group-heading"><div><strong>导出规格</strong><small>所有分页保持相同尺寸</small></div></div>
        <div className="canvas-spec"><span><strong>390 × 844</strong><small>逻辑尺寸</small></span><span><strong>2×</strong><small>清晰度</small></span><span><strong>约 {pageEstimate} 页</strong><small>预计页数</small></span></div>
        <p>导出前逐条测量气泡高度，消息保持完整并按照当前顺序分页。</p>
      </section>
    </div>
  );
}
