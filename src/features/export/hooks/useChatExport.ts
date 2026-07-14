import { useEffect, useState } from "react";
import { toBlob } from "html-to-image";
import { assertStablePagination, OversizedItemError, paginateItems } from "../../../pagination";
import { EXPORT_MESSAGE_CAPACITY } from "../../../templates";
import type { ChatItem, ChatProject, ExportResult } from "../../../types";
import { hasUnresolvedTimeSegments } from "../../chat/model/chatMigration";

const waitForPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

async function waitForAssetImages(assetUrls: Record<string, string>): Promise<void> {
  await Promise.all(Object.values(assetUrls).map((url) => new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("图片解码失败，请重新上传后再导出"));
    image.src = url;
    if (image.complete) void image.decode().then(resolve, reject);
  })));
}

interface UseChatExportOptions {
  project: ChatProject;
  assetUrls: Record<string, string>;
  onNotice: (message: string) => void;
}

export function useChatExport({ project, assetUrls, onNotice }: UseChatExportOptions) {
  const [pages, setPages] = useState<ChatItem[][]>([]);
  const [results, setResults] = useState<ExportResult[]>([]);
  const [exporting, setExporting] = useState(false);
  const [oversizedId, setOversizedId] = useState<string>();

  useEffect(() => () => {
    results.forEach((result) => URL.revokeObjectURL(result.url));
  }, [results]);

  const exportImages = async () => {
    setExporting(true);
    onNotice("正在测量消息并排版");
    setOversizedId(undefined);
    try {
      if (project.content.items.length === 0) throw new Error("至少添加一条内容后再导出");
      if (hasUnresolvedTimeSegments(project)) throw new Error("请先确认所有旧时间段的日期时间再导出");
      await document.fonts?.ready;
      await waitForAssetImages(assetUrls);
      await waitForPaint();

      const heights = new Map<string, number>();
      document.querySelectorAll<HTMLElement>(".measure-render-tree [data-measure-id]").forEach((node) => {
        const id = node.dataset.measureId;
        if (id) heights.set(id, Math.ceil(node.getBoundingClientRect().height));
      });
      const nextPages = paginateItems(project.content.items, heights, EXPORT_MESSAGE_CAPACITY);
      assertStablePagination(project.content.items, nextPages);
      setPages(nextPages);
      await waitForPaint();

      const output: ExportResult[] = [];
      const nodes = document.querySelectorAll<HTMLElement>("[data-export-page]");
      for (const [index, node] of [...nodes].entries()) {
        const blob = await toBlob(node, {
          width: project.export.width,
          height: project.export.height,
          pixelRatio: project.export.pixelRatio,
          cacheBust: true,
          backgroundColor: project.theme.appearance === "dark" ? "#161918" : "#ededed",
        });
        if (!blob) throw new Error("浏览器未能生成图片");
        output.push({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${project.title || "刻舟"}-${String(index + 1).padStart(3, "0")}.png`,
        });
      }
      if (output.length !== nextPages.length) throw new Error("导出页数与分页结果不一致");
      setResults(output);
      onNotice(`已生成 ${output.length} 张等高图片`);
    } catch (error) {
      if (error instanceof OversizedItemError) setOversizedId(error.itemId);
      onNotice(error instanceof Error ? error.message : "导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  return { pages, results, exporting, oversizedId, exportImages };
}
