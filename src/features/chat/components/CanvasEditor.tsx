import { Moon, Sun } from "@phosphor-icons/react";
import type { Appearance } from "../../../types";

interface CanvasEditorProps {
  appearance: Appearance;
  pageEstimate: number;
  onAppearanceChange: (appearance: Appearance) => void;
}

export function CanvasEditor({ appearance, pageEstimate, onAppearanceChange }: CanvasEditorProps) {
  return (
    <div className="canvas-editor">
      <div className="canvas-spec"><span><strong>390 × 844</strong><small>固定逻辑尺寸</small></span><span><strong>2×</strong><small>导出清晰度</small></span><span><strong>≈ {pageEstimate}</strong><small>预计页数</small></span></div>
      <div className="appearance-switch"><button className={appearance === "light" ? "active" : ""} onClick={() => onAppearanceChange("light")} type="button"><Sun size={18} />浅色</button><button className={appearance === "dark" ? "active" : ""} onClick={() => onAppearanceChange("dark")} type="button"><Moon size={18} />深色</button></div>
      <p>导出前会逐条测量气泡高度，再按固定画布分页。消息不会被截断，顺序也不会改变。</p>
    </div>
  );
}
