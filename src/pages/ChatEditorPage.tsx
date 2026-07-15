import { useMemo, useState } from "react";
import { DatePicker } from "antd-mobile";
import {
  ArrowLeft,
  CalendarBlank,
  ChatCircleDots,
  Check,
  Clock,
  DownloadSimple,
  Flag,
  ImageSquare,
  SlidersHorizontal,
  UserCircle,
} from "@phosphor-icons/react";
import { CanvasEditor } from "../features/chat/components/CanvasEditor";
import { ChatStyleEditor } from "../features/chat/components/ChatStyleEditor";
import { MessageEditor } from "../features/chat/components/MessageEditor";
import { ParticipantEditor } from "../features/chat/components/ParticipantEditor";
import { EventPointDialog } from "../features/chat/components/EventPointDialog";
import { ChatCanvas } from "../features/chat/ChatCanvas";
import { useAssetUrls } from "../features/chat/useAssetUrls";
import { useProjectAssets } from "../features/chat/hooks/useProjectAssets";
import {
  addTimeSegment,
  addEventPoint,
  appendMessageToPoint,
  applyTemplate,
  findMessage,
  findParticipant,
  moveMessageWithinPoint,
  updateChatProject,
} from "../features/chat/model/chatActions";
import {
  clampToReferenceDate,
  formatLocalDate,
  formatLocalDateTime,
  getReferenceDateMaximum,
  parseLocalDate,
  parseLocalDateTime,
} from "../features/chat/model/localDateTime";
import { ExportRenderTree, MeasureRenderTree } from "../features/export/ExportRenderTree";
import { ExportDialog } from "../features/export/ExportDialog";
import { useChatExport } from "../features/export/hooks/useChatExport";
import { EditorSheet } from "../shared/EditorSheet";
import type { ChatProject, EditorTab, TemplateId } from "../types";

interface ChatEditorPageProps {
  project: ChatProject;
  dirty: boolean;
  onChange: (updater: (project: ChatProject) => ChatProject) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
}

type PickerState =
  | { kind: "new-time"; value: Date }
  | { kind: "edit-time"; value: Date; segmentId: string }
  | { kind: "reference-date"; value: Date };

type EventDialogState = { mode: "new"; value: string } | { mode: "edit"; value: string; pointId: string };

const sheetTitles: Record<EditorTab, string> = {
  content: "编辑内容",
  people: "编辑人物",
  style: "编辑样式",
  canvas: "编辑画布",
};

export function ChatEditorPage({ project, dirty, onChange, onBack, onSave }: ChatEditorPageProps) {
  const [tab, setTab] = useState<EditorTab>("content");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picker, setPicker] = useState<PickerState>({ kind: "new-time", value: new Date() });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [eventDialog, setEventDialog] = useState<EventDialogState>();
  const [exportOpen, setExportOpen] = useState(false);
  const assetUrls = useAssetUrls(project);
  const saveImage = useProjectAssets(project.id, setNotice);
  const { pages, results, exporting, oversizedId, error: exportError, exportImages } = useChatExport({ project, assetUrls });
  const participants = project.content.participants;
  const pageEstimate = useMemo(() => Math.max(1, Math.ceil(project.content.items.length / 8)), [project.content.items.length]);
  const referenceDate = parseLocalDate(project.content.referenceDate) ?? new Date();
  const latestAllowedTime = getReferenceDateMaximum(project.content.referenceDate) ?? new Date(2100, 11, 31, 23, 59);

  const change = (mutate: (draft: ChatProject) => void) => onChange((current) => updateChatProject(current, mutate));
  const openPicker = (nextPicker: PickerState) => {
    setPicker(nextPicker);
    setPickerOpen(true);
  };

  const deleteItem = (id: string) => {
    change((draft) => {
      const target = draft.content.items.find((item) => item.id === id);
      const deletedPoint = target?.kind !== "message";
      draft.content.items = deletedPoint
        ? draft.content.items.filter((item) => item.id !== id && (item.kind !== "message" || item.pointId !== id))
        : draft.content.items.filter((item) => item.id !== id);
    });
  };

  const addMessage = (pointId: string, senderId: string) => {
    change((draft) => { appendMessageToPoint(draft, pointId, senderId); });
  };

  const openTimeEditor = (segmentId: string) => {
    const segment = project.content.items.find((item) => item.kind === "time-divider" && item.id === segmentId);
    const parsed = segment?.kind === "time-divider" ? parseLocalDateTime(segment.timestamp) : undefined;
    openPicker({
      kind: "edit-time",
      segmentId,
      value: new Date(Math.min((parsed ?? new Date()).getTime(), latestAllowedTime.getTime())),
    });
  };

  const confirmPicker = (value: Date) => {
    if (picker.kind === "reference-date") {
      change((draft) => { draft.content.referenceDate = formatLocalDate(value); });
    } else if (picker.kind === "edit-time") {
      const timestamp = formatLocalDateTime(clampToReferenceDate(value, project.content.referenceDate));
      change((draft) => {
        const item = draft.content.items.find((entry) => entry.kind === "time-divider" && entry.id === picker.segmentId);
        if (item?.kind === "time-divider") {
          item.timestamp = timestamp;
          delete item.legacyLabel;
          delete item.requiresConfirmation;
        }
      });
    } else {
      const timestamp = formatLocalDateTime(clampToReferenceDate(value, project.content.referenceDate));
      change((draft) => {
        addTimeSegment(draft, timestamp);
      });
    }
    setPickerOpen(false);
  };

  const uploadAvatar = async (participantId: string, file: File) => {
    const assetId = await saveImage(file);
    if (!assetId) return false;
    change((draft) => {
      const participant = findParticipant(draft, participantId);
      if (participant) participant.avatarAssetId = assetId;
    });
    return true;
  };

  const uploadBackground = async (file?: File) => {
    const assetId = await saveImage(file);
    if (!assetId) return;
    change((draft) => { draft.content.backgroundAssetId = assetId; });
  };

  const moveMessage = (id: string, direction: "up" | "down") => {
    change((draft) => { moveMessageWithinPoint(draft, id, direction); });
  };

  const openEventEditor = (pointId: string) => {
    const point = project.content.items.find((item) => item.kind === "event-divider" && item.id === pointId);
    if (point?.kind === "event-divider") setEventDialog({ mode: "edit", pointId, value: point.content });
  };

  const confirmEvent = () => {
    if (!eventDialog?.value.trim()) return;
    change((draft) => {
      if (eventDialog.mode === "new") addEventPoint(draft, eventDialog.value);
      else {
        const point = draft.content.items.find((item) => item.kind === "event-divider" && item.id === eventDialog.pointId);
        if (point?.kind === "event-divider") point.content = eventDialog.value.trim();
      }
    });
    setEventDialog(undefined);
  };

  const beginExport = () => {
    setExportOpen(true);
    void exportImages();
  };

  return (
    <main className="editor-page">
      <header className="editor-header editor-navbar">
        <button className="round-button" onClick={onBack} aria-label="返回" type="button"><ArrowLeft size={20} weight="bold" /></button>
        <label className="project-title"><span>{project.content.templateId === "wechat" ? "微信风格" : "WhatsApp 风格"}</span><input value={project.title} onChange={(event) => change((draft) => { draft.title = event.target.value; })} aria-label="项目名称" /></label>
        <button className="save-button" onClick={() => void onSave()} type="button"><Check size={15} weight="bold" />{dirty ? "保存" : "已保存"}</button>
      </header>

      <section className="preview-workbench editor-body">
        <div className="preview-meta"><span>实时预览</span><small>编辑模式带删除按钮</small></div>
        <div className="phone-scaler"><ChatCanvas project={project} assetUrls={assetUrls} onDelete={deleteItem} oversizedId={oversizedId} /></div>
      </section>

      <footer className="editor-footer">
        <EditorTabs
          tab={sheetOpen ? tab : undefined}
          onChange={(nextTab) => { setTab(nextTab); setSheetOpen(true); }}
          exporting={exporting}
          onExport={beginExport}
        />
      </footer>

      {notice ? <div className="editor-notice" role="status">{notice}<button onClick={() => setNotice("")} type="button">关闭</button></div> : null}

        <EditorSheet open={sheetOpen} title={sheetTitles[tab]} closeLabel={`关闭${sheetTitles[tab]}`} returnFocusId={`editor-tab-${tab}`} onClose={() => setSheetOpen(false)}
          barActions={tab === "content" ? (
            <>
              <button className="sheet-reference-date" onClick={() => openPicker({ kind: "reference-date", value: referenceDate })} type="button" aria-label={`设置今日日期，当前为${project.content.referenceDate}`}>
                <CalendarBlank size={16} weight="bold" /><span>今天</span><strong>{project.content.referenceDate.slice(5)}</strong>
              </button>
              <button onClick={() => openPicker({ kind: "new-time", value: new Date(Math.min(Date.now(), latestAllowedTime.getTime())) })} type="button"><Clock size={16} />时间</button>
              <button onClick={() => setEventDialog({ mode: "new", value: "" })} type="button"><Flag size={16} />事件</button>
            </>
          ) : undefined}
        >
          {tab === "content" ? (
            <MessageEditor
              items={project.content.items}
              participants={participants}
              currentParticipantId={project.content.currentParticipantId}
              assetUrls={assetUrls}
              onAddMessage={addMessage}
              onEditTime={openTimeEditor}
              onEditEvent={openEventEditor}
              onChangeMessage={(id, patch) => change((draft) => { const item = findMessage(draft, id); if (item) Object.assign(item, patch); })}
              onDelete={deleteItem}
              onMoveMessage={moveMessage}
            />
          ) : null}
          {tab === "people" ? (
            <ParticipantEditor
              conversationTitle={project.content.conversationTitle}
              showUsernames={project.content.showUsernames}
              participants={participants}
              assetUrls={assetUrls}
              onConversationTitleChange={(value) => change((draft) => { draft.content.conversationTitle = value; })}
              onShowUsernamesChange={(value) => change((draft) => { draft.content.showUsernames = value; })}
              onParticipantChange={(id, patch) => change((draft) => { const participant = findParticipant(draft, id); if (participant) Object.assign(participant, patch); })}
              onAvatarUpload={uploadAvatar}
              onAvatarRemove={(id) => change((draft) => {
                const participant = findParticipant(draft, id);
                if (participant) delete participant.avatarAssetId;
              })}
            />
          ) : null}
          {tab === "style" ? (
            <ChatStyleEditor
              templateId={project.content.templateId}
              hasBackground={Boolean(project.content.backgroundAssetId)}
              onTemplateChange={(templateId: TemplateId) => change((draft) => applyTemplate(draft, templateId))}
              onBackgroundUpload={(file) => void uploadBackground(file)}
              onBackgroundRemove={() => change((draft) => { delete draft.content.backgroundAssetId; })}
            />
          ) : null}
          {tab === "canvas" ? <CanvasEditor appearance={project.theme.appearance} pageEstimate={pageEstimate} onAppearanceChange={(appearance) => change((draft) => { draft.theme.appearance = appearance; })} /> : null}
        </EditorSheet>

      {pickerOpen ? (
        <DatePicker
          visible
          value={picker.value}
          precision={picker.kind === "reference-date" ? "day" : "minute"}
          title={picker.kind === "reference-date" ? "设置今日日期" : "选择日期和时间"}
          min={new Date(2000, 0, 1)}
          max={picker.kind === "reference-date" ? new Date(2100, 11, 31) : latestAllowedTime}
          renderLabel={(type, value) => {
            const units: Record<string, string> = { year: "年", month: "月", day: "日", hour: "时", minute: "分", second: "秒", week: "周", "week-day": "日", quarter: "季度", now: "" };
            return `${value}${units[type] ?? ""}`;
          }}
          closeOnMaskClick={false}
          onConfirm={confirmPicker}
          onCancel={() => setPickerOpen(false)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      <EventPointDialog
        open={Boolean(eventDialog)}
        mode={eventDialog?.mode ?? "new"}
        value={eventDialog?.value ?? ""}
        onChange={(value) => setEventDialog((current) => current ? { ...current, value } : current)}
        onConfirm={confirmEvent}
        onCancel={() => setEventDialog(undefined)}
      />
      <ExportDialog
        open={exportOpen}
        exporting={exporting}
        error={exportError}
        results={results}
        onClose={() => { if (!exporting) setExportOpen(false); }}
        onRetry={() => void exportImages()}
      />
      <MeasureRenderTree project={project} assetUrls={assetUrls} />
      <ExportRenderTree project={project} pages={pages} assetUrls={assetUrls} />
    </main>
  );
}

function EditorTabs({
  tab,
  onChange,
  exporting,
  onExport,
}: {
  tab?: EditorTab;
  onChange: (tab: EditorTab) => void;
  exporting: boolean;
  onExport: () => void;
}) {
  const tabs = [
    ["content", ChatCircleDots, "内容"],
    ["people", UserCircle, "人物"],
    ["style", SlidersHorizontal, "样式"],
    ["canvas", ImageSquare, "画布"],
  ] as const;
  return (
    <div className="editor-tabs" role="toolbar" aria-label="编辑与导出">
      {tabs.map(([id, Icon, label]) => (
        <button id={`editor-tab-${id}`} className={tab === id ? "active" : ""} onClick={() => onChange(id)} aria-pressed={tab === id} type="button" key={id}><Icon size={19} weight={tab === id ? "fill" : "regular"} />{label}</button>
      ))}
      <button className="export-tab" disabled={exporting} onClick={onExport} type="button"><DownloadSimple size={19} weight="bold" />{exporting ? "生成中" : "导出图片"}</button>
    </div>
  );
}
