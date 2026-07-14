import { ArrowLeft, CellSignalFull, DotsThree, WifiHigh } from "@phosphor-icons/react";

export function ChatStatusBar() {
  return (
    <div className="phone-status">
      <b>9:41</b>
      <span><CellSignalFull size={13} weight="fill" /><WifiHigh size={14} weight="bold" /><b>100</b></span>
    </div>
  );
}

export function ChatHeader({ title }: { title: string }) {
  return (
    <header className="conversation-bar">
      <ArrowLeft size={19} weight="bold" />
      <div><strong>{title || "未命名对话"}</strong><span>在线</span></div>
      <DotsThree size={22} weight="bold" />
    </header>
  );
}
