import type { ChatItem } from "./types";

export class OversizedItemError extends Error {
  itemId: string;

  constructor(itemId: string) {
    super("单条消息超过一页可用高度，请拆分后再导出");
    this.name = "OversizedItemError";
    this.itemId = itemId;
  }
}

export function paginateItems(
  items: ChatItem[],
  heights: ReadonlyMap<string, number>,
  capacity: number,
  itemGap = 0,
): ChatItem[][] {
  if (capacity <= 0) throw new Error("分页可用高度必须大于零");
  if (!Number.isFinite(itemGap) || itemGap < 0) throw new Error("消息间距不能小于零");
  if (items.length === 0) return [];

  const pages: ChatItem[][] = [];
  let currentPage: ChatItem[] = [];
  let usedHeight = 0;

  for (const item of items) {
    const height = heights.get(item.id);
    if (height === undefined || !Number.isFinite(height) || height <= 0) {
      throw new Error(`无法测量消息 ${item.id}`);
    }
    if (height > capacity) throw new OversizedItemError(item.id);

    const nextGap = currentPage.length > 0 ? itemGap : 0;
    if (currentPage.length > 0 && usedHeight + nextGap + height > capacity) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }

    if (currentPage.length > 0) usedHeight += itemGap;
    currentPage.push(item);
    usedHeight += height;
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

export function assertStablePagination(source: ChatItem[], pages: ChatItem[][]): void {
  const sourceIds = source.map((item) => item.id);
  const pageIds = pages.flat().map((item) => item.id);
  if (sourceIds.length !== pageIds.length) {
    throw new Error("分页后消息数量发生变化");
  }
  sourceIds.forEach((id, index) => {
    if (pageIds[index] !== id) throw new Error("分页后消息顺序发生变化");
  });
}
