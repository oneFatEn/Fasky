import { useEffect, useState } from "react";
import { toBlob } from "html-to-image";
import { assertStablePagination, OversizedItemError, paginateItems } from "../../../pagination";
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

function measurePageLayout(): { capacity: number; itemGap: number } {
  const stream = document.querySelector<HTMLElement>(".export-capacity-probe .chat-stream");
  if (!stream) throw new Error("无法测量导出画布");
  const style = window.getComputedStyle(stream);
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const capacity = stream.clientHeight - padding;
  const itemGap = Number.parseFloat(style.rowGap || style.gap) || 0;
  if (!Number.isFinite(capacity) || capacity <= 0) throw new Error("导出画布可用高度无效");
  return { capacity, itemGap };
}

async function readImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface UseChatExportOptions {
  project: ChatProject;
  assetUrls: Record<string, string>;
}

export function useChatExport({ project, assetUrls }: UseChatExportOptions) {
  const [pages, setPages] = useState<ChatItem[][]>([]);
  const [results, setResults] = useState<ExportResult[]>([]);
  const [exporting, setExporting] = useState(false);
  const [oversizedId, setOversizedId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => () => {
    results.forEach((result) => URL.revokeObjectURL(result.url));
  }, [results]);

  const exportImages = async () => {
    const output: ExportResult[] = [];
    setExporting(true);
    setError(undefined);
    setResults([]);
    setOversizedId(undefined);
    try {
      if (project.content.items.length === 0) throw new Error("至少添加一条内容后再导出");
      if (hasUnresolvedTimeSegments(project)) throw new Error("请先确认所有旧时间段的日期时间再导出");
      const pointIds = new Set(project.content.items.filter((item) => item.kind !== "message").map((item) => item.id));
      if (project.content.items.some((item) => item.kind === "message" && !pointIds.has(item.pointId))) {
        throw new Error("存在未关联时间或事件点的消息，请重新编辑后再导出");
      }
      await document.fonts?.ready;
      await waitForAssetImages(assetUrls);
      await waitForPaint();

      const heights = new Map<string, number>();
      document.querySelectorAll<HTMLElement>(".measure-render-tree [data-measure-id]").forEach((node) => {
        const id = node.dataset.measureId;
        if (id) heights.set(id, Math.ceil(node.getBoundingClientRect().height));
      });
      const { capacity, itemGap } = measurePageLayout();
      const nextPages = paginateItems(project.content.items, heights, capacity, itemGap);
      assertStablePagination(project.content.items, nextPages);
      setPages(nextPages);
      await waitForPaint();

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
        const dimensions = await readImageDimensions(blob);
        const expectedWidth = project.export.width * project.export.pixelRatio;
        const expectedHeight = project.export.height * project.export.pixelRatio;
        if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) {
          throw new Error(`图片尺寸异常，预期 ${expectedWidth} x ${expectedHeight}，实际 ${dimensions.width} x ${dimensions.height}`);
        }
        output.push({
          blob,
          url: URL.createObjectURL(blob),
          fileName: `${project.title || "刻舟"}-${String(index + 1).padStart(3, "0")}.png`,
        });
      }
      if (output.length !== nextPages.length) throw new Error("导出页数与分页结果不一致");
      setResults(output);
    } catch (error) {
      output.forEach((result) => URL.revokeObjectURL(result.url));
      if (error instanceof OversizedItemError) setOversizedId(error.itemId);
      setError(error instanceof Error ? error.message : "导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  return { pages, results, exporting, oversizedId, error, exportImages };
}
