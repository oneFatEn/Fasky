import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

interface EventPointDialogProps {
  open: boolean;
  value: string;
  mode: "new" | "edit";
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EventPointDialog({ open, value, mode, onChange, onConfirm, onCancel }: EventPointDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className="event-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <section className="event-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="event-dialog-copy">
          <strong id={titleId}>{mode === "new" ? "新增事件" : "修改事件"}</strong>
          <span>用一句话描述舞台上发生的事</span>
        </div>
        <label className="event-dialog-field">
          <span className="sr-only">事件内容</span>
          <input
            ref={inputRef}
            value={value}
            maxLength={80}
            placeholder="例如：门外突然响起敲门声"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && value.trim()) onConfirm();
            }}
          />
          <small>{value.trim().length}/80</small>
        </label>
        <div className="event-dialog-actions">
          <button className="event-cancel" onClick={onCancel} type="button">取消</button>
          <button className="event-confirm" disabled={!value.trim()} onClick={onConfirm} type="button">确定</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
