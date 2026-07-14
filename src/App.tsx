import { useEffect, useState } from "react";
import { clearRecovery, deleteProject, getRecovery, listProjects, saveProject, saveRecovery } from "./db";
import { createProject } from "./defaultProject";
import { ChatEditorPage } from "./pages/ChatEditorPage";
import { DraftsPage } from "./pages/DraftsPage";
import { HomePage } from "./pages/HomePage";
import { AppDialog } from "./shared/AppDialog";
import type { AppView, ChatProject, RecoveryRecord, TemplateId } from "./types";

type PendingDialog = { type: "back" } | { type: "delete"; project: ChatProject } | undefined;

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [project, setProject] = useState<ChatProject>();
  const [drafts, setDrafts] = useState<ChatProject[]>([]);
  const [recovery, setRecovery] = useState<RecoveryRecord>();
  const [dirty, setDirty] = useState(false);
  const [dialog, setDialog] = useState<PendingDialog>();
  const [storageError, setStorageError] = useState("");

  const refreshDrafts = async () => {
    try {
      setDrafts(await listProjects());
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "无法读取草稿");
    }
  };

  useEffect(() => {
    void refreshDrafts();
    void getRecovery().then(setRecovery).catch(() => setStorageError("未能读取自动恢复内容"));
  }, []);

  useEffect(() => {
    if (!dirty || !project) return;
    const timer = window.setTimeout(() => {
      void saveRecovery(project).then(() => setRecovery({ id: "current", project, savedAt: new Date().toISOString() }));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [project, dirty]);

  const startProject = (templateId: TemplateId) => {
    setProject(createProject(templateId));
    setDirty(true);
    setView("editor");
  };

  const openProject = (next: ChatProject) => {
    setProject(structuredClone(next));
    setDirty(false);
    setView("editor");
  };

  const updateProject = (updater: (current: ChatProject) => ChatProject) => {
    setProject((current) => current ? updater(current) : current);
    setDirty(true);
  };

  const commitProject = async () => {
    if (!project) return;
    const saved = { ...project, updatedAt: new Date().toISOString() };
    await saveProject(saved);
    await clearRecovery();
    setProject(saved);
    setRecovery(undefined);
    setDirty(false);
    await refreshDrafts();
  };

  const leaveEditor = async (save: boolean) => {
    if (save) await commitProject();
    else {
      await clearRecovery();
      setRecovery(undefined);
    }
    setProject(undefined);
    setDirty(false);
    setDialog(undefined);
    setView("home");
  };

  return (
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="mobile-app">
        {view === "home" ? (
          <HomePage
            draftCount={drafts.length}
            recovery={recovery}
            onStart={startProject}
            onOpenDrafts={() => setView("drafts")}
            onRestore={() => { if (recovery) { setProject(structuredClone(recovery.project)); setDirty(true); setView("editor"); } }}
            onDiscardRecovery={() => { void clearRecovery(); setRecovery(undefined); }}
          />
        ) : null}

        {view === "drafts" ? (
          <DraftsPage drafts={drafts} onBack={() => setView("home")} onOpen={openProject} onDelete={(item) => setDialog({ type: "delete", project: item })} />
        ) : null}

        {view === "editor" && project ? (
          <ChatEditorPage project={project} dirty={dirty} onChange={updateProject} onBack={() => dirty ? setDialog({ type: "back" }) : setView("home")} onSave={commitProject} />
        ) : null}

        {storageError ? <div className="global-error" role="alert">{storageError}<button onClick={() => setStorageError("")} type="button">关闭</button></div> : null}
      </div>

      <AppDialog
        open={dialog?.type === "back"}
        title="要保存这次编辑吗？"
        description="保存后可以从草稿箱继续。选择不保存会清除本次自动恢复内容。"
        actions={[
          { label: "保存并返回", tone: "primary", onClick: () => void leaveEditor(true) },
          { label: "不保存", tone: "danger", onClick: () => void leaveEditor(false) },
          { label: "继续编辑", onClick: () => setDialog(undefined) },
        ]}
      />

      <AppDialog
        open={dialog?.type === "delete"}
        title="删除这份草稿？"
        description={dialog?.type === "delete" ? `“${dialog.project.title}”及其本地图片会一起删除，且无法撤销。` : undefined}
        actions={[
          { label: "确认删除", tone: "danger", onClick: () => { if (dialog?.type === "delete") void deleteProject(dialog.project.id).then(refreshDrafts); setDialog(undefined); } },
          { label: "取消", onClick: () => setDialog(undefined) },
        ]}
      />
    </div>
  );
}
