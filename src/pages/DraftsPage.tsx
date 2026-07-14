import { ArrowLeft, ArrowRight, ChatsCircle, Trash } from "@phosphor-icons/react";
import type { ChatProject } from "../types";

interface DraftsPageProps {
  drafts: ChatProject[];
  onBack: () => void;
  onOpen: (project: ChatProject) => void;
  onDelete: (project: ChatProject) => void;
}

export function DraftsPage({ drafts, onBack, onOpen, onDelete }: DraftsPageProps) {
  return (
    <main className="drafts-page">
      <header className="page-header">
        <button className="round-button" onClick={onBack} aria-label="返回首页" type="button"><ArrowLeft size={20} weight="bold" /></button>
        <div><span>本地项目</span><h1>草稿箱</h1></div>
        <span className="count-badge">{drafts.length}</span>
      </header>

      {drafts.length === 0 ? (
        <div className="empty-state">
          <span><ChatsCircle size={34} /></span>
          <h2>这里还很安静</h2>
          <p>编辑中的对话保存后，会在这里按最近修改时间排列。</p>
          <button onClick={onBack} type="button">去创建第一张图</button>
        </div>
      ) : (
        <section className="draft-list" aria-label="草稿列表">
          {drafts.map((draft, index) => {
            const messages = draft.content.items.filter((item) => item.kind === "message");
            return (
              <article className="draft-card" key={draft.id}>
                <button className="draft-main" onClick={() => onOpen(draft)} type="button">
                  <span className={`draft-thumb thumb-${draft.content.templateId}`}>
                    <i /><i /><i />
                  </span>
                  <span className="draft-copy">
                    <small>NO. {String(index + 1).padStart(2, "0")}</small>
                    <strong>{draft.title}</strong>
                    <span>{messages.length} 条消息 · {draft.content.templateId === "wechat" ? "微信" : "WhatsApp"}</span>
                    <time>{new Date(draft.updatedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
                  </span>
                  <ArrowRight size={18} weight="bold" />
                </button>
                <button className="draft-delete" onClick={() => onDelete(draft)} aria-label={`删除${draft.title}`} type="button"><Trash size={17} /></button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
