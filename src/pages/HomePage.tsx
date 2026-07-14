import {
  ArrowRight,
  ChatCircleDots,
  Check,
  FilmStrip,
  FolderOpen,
  Hash,
  PaperPlaneTilt,
  TextAlignLeft,
} from "@phosphor-icons/react";
import { CHAT_TEMPLATES } from "../templates";
import type { RecoveryRecord, TemplateId } from "../types";

interface HomePageProps {
  draftCount: number;
  recovery?: RecoveryRecord;
  onStart: (template: TemplateId) => void;
  onOpenDrafts: () => void;
  onRestore: () => void;
  onDiscardRecovery: () => void;
}

const futureFormats = [
  { label: "推特体", icon: ChatCircleDots },
  { label: "论坛体", icon: TextAlignLeft },
  { label: "短信体", icon: PaperPlaneTilt },
  { label: "弹幕体", icon: FilmStrip },
];

export function HomePage({
  draftCount,
  recovery,
  onStart,
  onOpenDrafts,
  onRestore,
  onDiscardRecovery,
}: HomePageProps) {
  return (
    <main className="home-page">
      <header className="home-header">
        <div className="wordmark"><span>刻</span> 刻舟</div>
        <button className="draft-link" onClick={onOpenDrafts} type="button">
          <FolderOpen size={18} weight="bold" />草稿箱 <b>{draftCount}</b>
        </button>
      </header>

      <section className="home-hero">
        <div className="hero-number">01</div>
        <p className="eyebrow">CHAT IMAGE STUDIO</p>
        <h1>把对话，做成<br /><em>一张会讲故事的图。</em></h1>
        <p className="hero-description">输入内容，调整人物与画面，生成适合分享的真实聊天长图。</p>
      </section>

      {recovery ? (
        <section className="recovery-card" aria-label="未保存内容">
          <div>
            <span>发现未保存内容</span>
            <strong>{recovery.project.title}</strong>
            <small>{new Date(recovery.savedAt).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
          <div className="recovery-actions">
            <button onClick={onDiscardRecovery} type="button">忽略</button>
            <button onClick={onRestore} type="button">继续编辑 <ArrowRight size={15} weight="bold" /></button>
          </div>
        </section>
      ) : null}

      <section className="template-section">
        <div className="section-label"><span>选择聊天样式</span><small>MVP · 双人对话</small></div>
        <div className="template-grid">
          {(Object.keys(CHAT_TEMPLATES) as TemplateId[]).map((templateId, index) => {
            const template = CHAT_TEMPLATES[templateId];
            return (
              <button className={`template-poster poster-${templateId}`} onClick={() => onStart(templateId)} type="button" key={templateId}>
                <span className="poster-index">0{index + 1}</span>
                <div className="poster-chat" aria-hidden="true">
                  <i /><i /><i />
                </div>
                <span className="poster-copy"><strong>{template.name}</strong><small>{template.description}</small></span>
                <span className="poster-arrow"><ArrowRight size={17} weight="bold" /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="roadmap-strip">
        <div className="section-label"><span>接下来</span><small>已留扩展接口</small></div>
        <div className="future-formats">
          {futureFormats.map(({ label, icon: Icon }) => (
            <div key={label}><Icon size={18} /><span>{label}</span><small>规划中</small></div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <Hash size={15} /> 浏览器本地保存 <span><Check size={13} weight="bold" /> 不上传你的内容</span>
      </footer>
    </main>
  );
}
