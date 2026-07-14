import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChatCircleDots,
  Check,
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
  applyTemplate,
  findMessage,
  findParticipant,
  insertChatItem,
  updateChatProject,
} from "../features/chat/model/chatActions";
import { ExportRenderTree, MeasureRenderTree } from "../features/export/ExportRenderTree";
import { useChatExport } from "../features/export/hooks/useChatExport";
import type { ChatItem, ChatProject, EditorTab, TemplateId } from "../types";

interface ChatEditorPageProps {
  project: ChatProject;
  dirty: boolean;
  onChange: (updater: (project: ChatProject) => ChatProject) => void;
  onBack: () => void;
  onSave: () => Promise<void>;
}

interface DeletedItem {
  item: ChatItem;
  index: number;
}

const makeId = () => crypto.randomUUID();

export function ChatEditorPage({ project, dirty, onChange, onBack, onSave }: ChatEditorPageProps) {
  const [tab, setTab] = useState<EditorTab>("content");
  const [notice, setNotice] = useState("");
  const undoRef = useRef<DeletedItem | undefined>(undefined);
  const assetUrls = useAssetUrls(project);
  const saveImage = useProjectAssets(project.id, setNotice);
  const { pages, results, exporting, oversizedId, exportImages } = useChatExport({ project, assetUrls, onNotice: setNotice });
  const participants = project.content.participants;
  const pageEstimate = useMemo(() => Math.max(1, Math.ceil(project.content.items.length / 8)), [project.content.items.length]);

  const change = (mutate: (draft: ChatProject) => void) => onChange((current) => updateChatProject(current, mutate));

  const deleteItem = (id: string) => {
    change((draft) => {
      const index = draft.content.items.findIndex((item) => item.id === id);
      if (index >= 0) {
        const [item] = draft.content.items.splice(index, 1);
        if (item) undoRef.current = { item, index };
      }
    });
    setNotice("已删除一条内容");
  };

  const restoreDeletedItem = () => {
    const deleted = undoRef.current;
    if (!deleted) return;
    change((draft) => insertChatItem(draft, deleted.item, deleted.index));
    undoRef.current = undefined;
    setNotice("");
  };

  const addMessage = () => {
    const senderId = participants[0]?.id;
    if (!senderId) return;
    change((draft) => {
      draft.content.items.push({ id: makeId(), kind: "message", senderId, messageType: "text", content: "输入新的消息" });
    });
    setTab("content");
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

      <section className="editor-panel editor-footer">
        <EditorTabs tab={tab} onChange={setTab} />
        <div className="panel-body">
          {tab === "content" ? (
            <MessageEditor
              items={project.content.items}
              participants={participants}
              onAddTime={() => change((draft) => { draft.content.items.push({ id: makeId(), kind: "time-divider", label: "今天 18:30" }); })}
              onChangeTime={(id, label) => change((draft) => { const item = draft.content.items.find((entry) => entry.id === id); if (item?.kind === "time-divider") item.label = label; })}
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
        </div>

        {notice ? <div className="editor-notice" role="status">{notice}{undoRef.current ? <button onClick={restoreDeletedItem} type="button">撤销</button> : null}</div> : null}
        <div className="editor-actions"><button className="secondary-action" onClick={addMessage} type="button"><Plus size={18} weight="bold" />添加消息</button><button className="primary-action" disabled={exporting || project.content.items.length === 0} onClick={() => void exportImages()} type="button"><DownloadSimple size={18} weight="bold" />{exporting ? "生成中" : "导出图片"}</button></div>
      </section>

      {results.length > 0 ? <section className="export-results"><div><span>导出完成</span><strong>{results.length} 张图片，逻辑高度均为 {project.export.height}px</strong></div><div>{results.map((result, index) => <a href={result.url} download={result.fileName} key={result.url}>下载第 {index + 1} 张</a>)}</div></section> : null}
      <MeasureRenderTree project={project} assetUrls={assetUrls} />
      <ExportRenderTree project={project} pages={pages} assetUrls={assetUrls} />
    </main>
  );
}

function EditorTabs({ tab, onChange }: { tab: EditorTab; onChange: (tab: EditorTab) => void }) {
  const tabs = [
    ["content", ChatCircleDots, "内容"],
    ["people", UserCircle, "人物"],
    ["style", SlidersHorizontal, "样式"],
    ["canvas", ImageSquare, "画布"],
  ] as const;
  return (
    <div className="editor-tabs" role="tablist" aria-label="编辑区域">
      {tabs.map(([id, Icon, label]) => (
        <button className={tab === id ? "active" : ""} onClick={() => onChange(id)} role="tab" aria-selected={tab === id} type="button" key={id}><Icon size={18} weight={tab === id ? "fill" : "regular"} />{label}</button>
      ))}
    </div>
  );
}
