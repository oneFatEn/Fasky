import { describe, expect, it } from "vitest";
import { assertStablePagination, OversizedItemError, paginateItems } from "./pagination";
import type { ChatItem } from "./types";

const items: ChatItem[] = [
  { id: "time", kind: "time-divider", timestamp: "2026-07-14T16:28" },
  { id: "one", kind: "message", senderId: "a", timeSegmentId: "time", messageType: "text", content: "一" },
  { id: "two", kind: "message", senderId: "b", timeSegmentId: "time", messageType: "text", content: "二" },
];

describe("paginateItems", () => {
  it("keeps an item that exactly fills the remaining page space", () => {
    const pages = paginateItems(items, new Map([["time", 20], ["one", 40], ["two", 40]]), 100);
    expect(pages).toEqual([items]);
    expect(() => assertStablePagination(items, pages)).not.toThrow();
  });

  it("moves an intact item to the next page", () => {
    const pages = paginateItems(items, new Map([["time", 20], ["one", 50], ["two", 40]]), 100);
    expect(pages.map((page) => page.map((item) => item.id))).toEqual([["time", "one"], ["two"]]);
    expect(() => assertStablePagination(items, pages)).not.toThrow();
  });

  it("blocks an item taller than a page", () => {
    expect(() => paginateItems(items, new Map([["time", 20], ["one", 101], ["two", 40]]), 100))
      .toThrowError(OversizedItemError);
  });

  it("rejects missing measurements", () => {
    expect(() => paginateItems(items, new Map([["time", 20]]), 100)).toThrow("无法测量消息 one");
  });
});

describe("assertStablePagination", () => {
  it("rejects missing, duplicate, or reordered items", () => {
    expect(() => assertStablePagination(items, [[items[0], items[2]]])).toThrow("分页后消息数量发生变化");
    expect(() => assertStablePagination(items, [[items[1], items[0], items[2]]])).toThrow("分页后消息顺序发生变化");
  });
});
