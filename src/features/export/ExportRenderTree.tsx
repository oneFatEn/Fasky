import type { ChatItem, ChatProject } from "../../types";
import { ChatCanvas } from "../chat/ChatCanvas";

interface ExportRenderTreeProps {
  project: ChatProject;
  pages: ChatItem[][];
  assetUrls: Record<string, string>;
}

export function ExportRenderTree({ project, pages, assetUrls }: ExportRenderTreeProps) {
  return (
    <div className="export-render-tree" aria-hidden="true">
      {pages.map((items, index) => (
        <div className="export-node" data-export-page={index} key={`${index}-${items[0]?.id ?? "empty"}`}>
          <ChatCanvas project={project} items={items} assetUrls={assetUrls} mode="export" />
        </div>
      ))}
    </div>
  );
}

export function MeasureRenderTree({ project, assetUrls }: Omit<ExportRenderTreeProps, "pages">) {
  return (
    <>
      <div className="measure-render-tree" aria-hidden="true">
        <ChatCanvas project={project} assetUrls={assetUrls} mode="measure" />
      </div>
      <div className="export-capacity-probe" aria-hidden="true">
        <ChatCanvas project={project} items={[]} assetUrls={assetUrls} mode="export" />
      </div>
    </>
  );
}
