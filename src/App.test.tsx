/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const dbMocks = vi.hoisted(() => ({
  clearRecovery: vi.fn(async () => undefined),
  deleteProject: vi.fn(async () => undefined),
  getAsset: vi.fn(async () => undefined),
  getRecovery: vi.fn(async () => undefined),
  listProjects: vi.fn(async () => []),
  saveAsset: vi.fn(async () => "asset-id"),
  saveProject: vi.fn(async () => undefined),
  saveRecovery: vi.fn(async () => undefined),
}));

vi.mock("./db", () => dbMocks);

function buttonByText(container: HTMLElement, label: string): HTMLButtonElement {
  const button = [...container.querySelectorAll("button")]
    .find((candidate) => candidate.textContent?.trim() === label);
  if (!button) throw new Error(`找不到按钮：${label}`);
  return button;
}

function backButton(container: HTMLElement): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>('button[aria-label="返回"]');
  if (!button) throw new Error("找不到返回按钮");
  return button;
}

function templateButton(container: HTMLElement, template: "wechat" | "whatsapp"): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`.poster-${template}`);
  if (!button) throw new Error(`找不到模板按钮：${template}`);
  return button;
}

async function click(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.click();
    await Promise.resolve();
  });
}

describe("editor back flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    dbMocks.listProjects.mockResolvedValue([]);
    dbMocks.getRecovery.mockResolvedValue(undefined);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
      configurable: true,
      value: true,
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<App />);
      await Promise.resolve();
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("returns directly when the current project has no unsaved changes", async () => {
    await click(templateButton(container, "wechat"));
    await click(buttonByText(container, "保存"));

    await click(backButton(container));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain("选择聊天样式");
    expect(dbMocks.saveProject).toHaveBeenCalledTimes(1);
  });

  it("keeps editing when the dirty-state dialog is cancelled", async () => {
    await click(templateButton(container, "whatsapp"));
    await click(backButton(container));
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain("要保存这次编辑吗");

    await click(buttonByText(container, "继续编辑"));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain("实时预览");
    expect(dbMocks.saveProject).not.toHaveBeenCalled();
  });

  it("discards recovery and returns when the user chooses not to save", async () => {
    await click(templateButton(container, "wechat"));
    await click(backButton(container));

    await click(buttonByText(container, "不保存"));

    expect(container.textContent).toContain("选择聊天样式");
    expect(dbMocks.clearRecovery).toHaveBeenCalledTimes(1);
    expect(dbMocks.saveProject).not.toHaveBeenCalled();
  });

  it("saves the draft, clears recovery, and returns from the dirty-state dialog", async () => {
    await click(templateButton(container, "whatsapp"));
    await click(backButton(container));

    await click(buttonByText(container, "保存并返回"));

    expect(container.textContent).toContain("选择聊天样式");
    expect(dbMocks.saveProject).toHaveBeenCalledTimes(1);
    expect(dbMocks.clearRecovery).toHaveBeenCalledTimes(1);
  });
});
