import type { ReactNode } from "react";

interface DialogAction {
  label: string;
  tone?: "primary" | "danger" | "neutral";
  onClick: () => void;
}

interface AppDialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions: DialogAction[];
}

export function AppDialog({ open, title, description, children, actions }: AppDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-copy">
          <span className="dialog-eyebrow">FAKSY</span>
          <h2 id="dialog-title">{title}</h2>
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        <div className="dialog-actions">
          {actions.map((action) => (
            <button
              className={`dialog-action ${action.tone ?? "neutral"}`}
              key={action.label}
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
