import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Popup } from "antd-mobile";

interface EditorSheetProps {
  open: boolean;
  title: ReactNode;
  barStart?: ReactNode;
  barActions?: ReactNode;
  closeLabel: string;
  returnFocusId: string;
  onClose: () => void;
  children: ReactNode;
}

export function EditorSheet({
  open,
  title,
  barStart,
  barActions,
  closeLabel,
  returnFocusId,
  onClose,
  children,
}: EditorSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeAndRestoreFocus = useCallback(() => {
    onClose();
    document.getElementById(returnFocusId)?.focus();
  }, [onClose, returnFocusId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAndRestoreFocus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeAndRestoreFocus, open]);

  return (
    <Popup
      visible={open}
      position="bottom"
      closeOnMaskClick={false}
      closeOnSwipe={false}
      destroyOnClose
      bodyClassName="editor-sheet-popup"
      onClose={closeAndRestoreFocus}
      afterShow={() => dialogRef.current?.focus()}
      afterClose={() => document.getElementById(returnFocusId)?.focus()}
    >
      <section
        ref={dialogRef}
        className="editor-sheet"
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-hidden={open ? undefined : "true"}
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="sheet-bar">
          {barStart ? <div className="sheet-bar-start">{barStart}</div> : null}
          <strong id={titleId}>{title}</strong>
          <div className="sheet-bar-actions">{barActions}</div>
          <button className="sheet-close" onClick={closeAndRestoreFocus} aria-label={closeLabel} type="button">
            <X size={19} weight="bold" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </Popup>
  );
}
