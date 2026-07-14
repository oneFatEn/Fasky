import { useMemo, useState } from "react";
import { DatePicker } from "antd-mobile";
import {
  ArrowLeft,
  CalendarBlank,
  ChatCircleDots,
  Check,
  Clock,
  DownloadSimple,
  ImageSquare,
  Plus,
  SlidersHorizontal,
  UserCircle,
} from "@phosphor-icons/react";
import { CanvasEditor } from "../features/chat/components/CanvasEditor";
import { ChatStyleEditor } from "../features/chat/components/ChatStyleEditor";
import { MessageEditor } from "../features/chat/components/MessageEditor";
import { ParticipantEditor } from "../features/chat/components/ParticipantEditor";
import { ChatCanvas } from "../features/chat/ChatCanvas";
import { useAssetUrls } from "../features/chat/useAssetUrls";
import { useProjectAssets } from "../features/chat/hooks/useProjectAssets";
import {
  addTimeSegment,
  appendMessageToTimeSegment,
  applyTemplate,
  findMessage,
  findParticipant,
  updateChatProject,
} from "../features/chat/model/chatActions";
import {
  formatLocalDate,
  formatLocalDateTime,
  parseLocalDate,
  parseLocalDateTime,
} from "../features/chat/model/localDateTime";
import { ExportRenderTree, MeasureRenderTree } from "../features/export/ExportRenderTree";
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
  | { kind: "new-time-with-message"; value: Date }
  | { kind: "edit-time"; value: Date; segmentId: string }
  | { kind: "reference-date"; value: Date };

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
  const assetUrls = useAssetUrls(project);
  const saveImage = useProjectAssets(project.id, setNotice);
  const { pages, results, exporting, oversizedId, exportImages } = useChatExport({ project, assetUrls, onNotice: setNotice });
  const participants = project.content.participants;
  const pageEstimate = useMemo(() => Math.max(1, Math.ceil(project.content.items.length / 8)), [project.content.items.length]);
  const currentParticipant = participants.find((person) => person.id === project.content.currentParticipantId);

  const change = (mutate: (draft: ChatProject) => void) => onChange((current) => updateChatProject(current, mutate));
  const openPicker = (nextPicker: PickerState) => {
    setPicker(nextPicker);
    setPickerOpen(true);
  };

  const deleteItem = (id: string) => {
    change((draft) => {
      const target = draft.content.items.find((item) => item.id === id);
      const deletedSegment = target?.kind === "time-divider";
      draft.content.items = deletedSegment
        ? draft.content.items.filter((item) => item.id !== id && (item.kind !== "message" || item.timeSegmentId !== id))
        : draft.content.items.filter((item) => item.id !== id);
    });
  };

  const addMessage = (timeSegmentId: string, senderId: string) => {
    change((draft) => { appendMessageToTimeSegment(draft, timeSegmentId, senderId); });
  };

  const addMessageToLatestSegment = () => {
    if (!currentParticipant) return;
    const segment = [...project.content.items].reverse().find((item) => item.kind === "time-divider");
    if (!segment) {
      openPicker({ kind: "new-time-with-message", value: new Date() });
      return;
    }
    addMessage(segment.id, currentParticipant.id);
  };

  const openTimeEditor = (segmentId: string) => {
    const segment = project.content.items.find((item) => item.kind === "time-divider" && item.id === segmentId);
    const referenceDate = parseLocalDate(project.content.referenceDate) ?? new Date();
    referenceDate.setHours(12, 0, 0, 0);
    openPicker({
      kind: "edit-time",
      segmentId,
      value: segment?.kind === "time-divider" ? parseLocalDateTime(segment.timestamp) ?? referenceDate : referenceDate,
    });
  };

  const confirmPicker = (value: Date) => {
    if (picker.kind === "reference-date") {
      change((draft) => { draft.content.referenceDate = formatLocalDate(value); });
    } else if (picker.kind === "edit-time") {
      change((draft) => {
        const item = draft.content.items.find((entry) => entry.kind === "time-divider" && entry.id === picker.segmentId);
        if (item?.kind === "time-divider") {
          item.timestamp = formatLocalDateTime(value);
          delete item.legacyLabel;
          delete item.requiresConfirmation;
        }
      });
    } else {
      change((draft) => {
        const segment = addTimeSegment(draft, formatLocalDateTime(value));
        if (picker.kind === "new-time-with-message") {
          appendMessageToTimeSegment(draft, segment.id, draft.content.currentParticipantId);
        }
      });
    }
    setPickerOpen(false);
  };

  const uploadAvatar = async (participantId: string, file?: File) => {
    const assetId = await saveImage(file);
    if (!assetId) return;
    change((draft) => {
      const participant = findParticipant(draft, participantId);
      if (participant) participant.avatarAssetId = assetId;
    });
  };

  const uploadBackground = async (file?: File) => {
    const assetId = await saveImage(file);
    if (!assetId) return;
    change((draft) => { draft.content.backgroundAssetId = assetId; });
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
          onExport={() => void exportImages()}
        />
      </footer>

      {notice ? <div className="editor-notice" role="status">{notice}<button onClick={() => setNotice("")} type="button">关闭</button></div> : null}

        <EditorSheet open={sheetOpen} title={sheetTitles[tab]} closeLabel={`关闭${sheetTitles[tab]}`} returnFocusId={`editor-tab-${tab}`} onClose={() => setSheetOpen(false)}
          barActions={tab === "content" ? (
            <>
              <button onClick={addMessageToLatestSegment} type="button"><Plus size={16} weight="bold" />气泡</button>
              <button onClick={() => openPicker({ kind: "new-time", value: new Date() })} type="button"><Clock size={16} />时间</button>
              <button onClick={() => openPicker({ kind: "reference-date", value: parseLocalDate(project.content.referenceDate) ?? new Date() })} aria-label="设置今天" type="button"><CalendarBlank size={18} /></button>
            </>
          ) : undefined}
        >
          {tab === "content" ? (
            <MessageEditor
              items={project.content.items}
              participants={participants}
              currentParticipantId={project.content.currentParticipantId}
              onAddMessage={addMessage}
              onEditTime={openTimeEditor}
              onChangeMessage={(id, patch) => change((draft) => { const item = findMessage(draft, id); if (item) Object.assign(item, patch); })}
              onDelete={deleteItem}
            />
          ) : null}
          {tab === "people" ? (
            <ParticipantEditor
              conversationTitle={project.content.conversationTitle}
              showUsernames={project.content.showUsernames}
              participants={participants}
              onConversationTitleChange={(value) => change((draft) => { draft.content.conversationTitle = value; })}
              onShowUsernamesChange={(value) => change((draft) => { draft.content.showUsernames = value; })}
              onParticipantChange={(id, patch) => change((draft) => { const participant = findParticipant(draft, id); if (participant) Object.assign(participant, patch); })}
              onAvatarUpload={(id, file) => void uploadAvatar(id, file)}
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
          title={picker.kind === "reference-date" ? "设置虚构对话中的今天" : "选择日期和时间"}
          min={new Date(2000, 0, 1)}
          max={new Date(2100, 11, 31, 23, 59)}
          closeOnMaskClick={false}
          onConfirm={confirmPicker}
          onCancel={() => setPickerOpen(false)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}

      {results.length > 0 ? <section className="export-results"><div><span>导出完成</span><strong>{results.length} 张图片，逻辑高度均为 {project.export.height}px</strong></div><div>{results.map((result, index) => <a href={result.url} download={result.fileName} key={result.url}>下载第 {index + 1} 张</a>)}</div></section> : null}
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
