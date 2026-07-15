import { expect, test, type Page } from "@playwright/test";
import { createProject } from "../src/defaultProject";
import type { ChatProject } from "../src/types";

const solidBackground = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
    <rect width="390" height="844" fill="#d2185b"/>
  </svg>
`);

const avatarImage = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="48" fill="#176b5b"/>
    <circle cx="48" cy="38" r="18" fill="#f4f1e8"/>
    <path d="M18 90c4-20 16-30 30-30s26 10 30 30" fill="#f4f1e8"/>
  </svg>
`);

async function startTemplate(page: Page, name: "微信风格" | "WhatsApp 风格") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.getByRole("article", { name: `${name}聊天预览` })).toBeVisible();
}

async function assertViewportShell(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics).toEqual({
    viewportWidth: width,
    viewportHeight: 844,
    documentWidth: width,
    documentHeight: 844,
    bodyWidth: width,
  });
}

async function seedProject(page: Page, project: ChatProject) {
  await page.goto("/");
  await page.evaluate(async (record) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("faksy", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("projects", "readwrite");
      transaction.objectStore("projects").put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }, project);
  await page.reload();
  await page.getByRole("button", { name: /草稿箱 1/ }).click();
  await page.locator(".draft-main").filter({ hasText: project.title }).click();
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("微信与 WhatsApp 在 375px 和 390px 下完成编辑与导出且无溢出", async ({ page }) => {
  for (const template of ["微信风格", "WhatsApp 风格"] as const) {
    for (const width of [375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await startTemplate(page, template);
      await assertViewportShell(page, width);
      for (const tab of ["内容", "人物", "样式", "画布"] as const) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        await expect(page.getByRole("dialog", { name: `编辑${tab}` })).toBeVisible();
        await assertViewportShell(page, width);
        await page.getByRole("button", { name: `关闭编辑${tab}` }).click();
      }
      await page.getByRole("button", { name: "导出图片", exact: true }).click();
      await expect(page.getByText("共 1 张", { exact: true })).toBeVisible({ timeout: 60_000 });
      await page.getByRole("button", { name: "关闭导出弹窗" }).click();
      await page.getByRole("button", { name: "返回" }).click();
      await page.getByRole("button", { name: "不保存" }).click();
    }
  }
});

test("WhatsApp 完整编辑流程生成带自定义背景的多页等尺寸 PNG", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startTemplate(page, "WhatsApp 风格");
  await page.getByRole("textbox", { name: "项目名称" }).fill("背景导出验收");

  await page.getByRole("button", { name: "人物", exact: true }).click();
  await page.locator(".people-settings .field.full input").fill("海边计划");
  await page.getByRole("switch", { name: "显示用户名" }).click();
  await expect(page.getByRole("switch", { name: "显示用户名" })).toBeChecked();
  const avatarInputs = page.locator('.participant-avatar-uploader input[type="file"]');
  expect(await avatarInputs.count()).toBe(2);
  await avatarInputs.nth(0).setInputFiles({
    name: "avatar.svg",
    mimeType: "image/svg+xml",
    buffer: avatarImage,
  });
  await page.getByRole("button", { name: "关闭编辑人物" }).click();

  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.locator('.background-upload-control input[type="file"]').setInputFiles({
    name: "solid-background.svg",
    mimeType: "image/svg+xml",
    buffer: solidBackground,
  });
  await expect(page.locator(".phone-scaler .chat-background-image")).toHaveCount(1);
  await page.getByRole("button", { name: "关闭编辑样式" }).click();

  await page.getByRole("button", { name: "画布", exact: true }).click();
  await page.getByRole("option", { name: "深色", exact: true }).click();
  await expect(page.locator(".phone-scaler .chat-phone")).toHaveClass(/is-dark/);
  await page.getByRole("button", { name: "关闭编辑画布" }).click();

  await page.getByRole("button", { name: "内容", exact: true }).click();
  await page.getByRole("button", { name: "事件", exact: true }).click();
  await page.getByRole("textbox", { name: /事件内容/ }).fill("海浪越过了堤岸");
  await page.getByRole("button", { name: "确定", exact: true }).click();
  await expect(page.locator(".phone-scaler .event-divider")).toHaveText("海浪越过了堤岸");
  const dividerAlpha = await page.locator(".phone-scaler").evaluate((root) => {
    const alpha = (selector: string) => {
      const value = getComputedStyle(root.querySelector(selector)!).backgroundColor;
      const match = value.match(/rgba?\([^,]+,[^,]+,[^,]+(?:,\s*([\d.]+))?\)/);
      return match?.[1] ? Number(match[1]) : 1;
    };
    return { time: alpha(".time-divider"), event: alpha(".event-divider") };
  });
  expect(dividerAlpha.time).toBeGreaterThanOrEqual(0.8);
  expect(dividerAlpha.event).toBeGreaterThanOrEqual(0.9);

  const otherEventButton = page.getByRole("button", { name: /在此点末尾新增乔屿的气泡/ });
  const currentEventButton = page.getByRole("button", { name: /在此点末尾新增林澄的气泡/ });
  await otherEventButton.last().click();
  await currentEventButton.last().click();

  const longText = "沿着海岸继续走，风把路灯的影子吹得很长。".repeat(8);
  const addCurrentAtTime = page.getByRole("button", { name: /在此点末尾新增林澄的气泡/ }).first();
  for (let index = 0; index < 5; index += 1) {
    await addCurrentAtTime.click();
    const textareas = page.locator(".message-editor-row textarea");
    const count = await textareas.count();
    await textareas.nth(count - 3).fill(`${index + 1}。${longText}`);
  }
  await page.getByRole("button", { name: "关闭编辑内容" }).click();

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByRole("button", { name: "已保存", exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /草稿箱 1/ }).click();
  await page.locator(".draft-main").filter({ hasText: "背景导出验收" }).click();
  await expect(page.locator(".phone-scaler .chat-background-image")).toHaveCount(1);
  await expect(page.locator(".phone-scaler .chat-avatar img")).not.toHaveCount(0);

  await page.getByRole("button", { name: "导出图片", exact: true }).click();
  await expect(page.getByText(/共 \d+ 张/)).toBeVisible({ timeout: 60_000 });

  const exportImages = page.locator(".export-slide img");
  const pageCount = await exportImages.count();
  expect(pageCount).toBe(3);

  const dimensions = await exportImages.evaluateAll((images) => images.map((node) => {
    const image = node as HTMLImageElement;
    return { width: image.naturalWidth, height: image.naturalHeight };
  }));
  expect(dimensions).toEqual(Array.from({ length: pageCount }, () => ({ width: 780, height: 1688 })));

  const backgroundPixelCount = await exportImages.first().evaluate(async (node) => {
    const image = node as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return 0;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let matches = 0;
    for (let offset = 0; offset < pixels.length; offset += 16) {
      if (Math.abs(pixels[offset] - 210) < 8
        && Math.abs(pixels[offset + 1] - 24) < 8
        && Math.abs(pixels[offset + 2] - 91) < 8) matches += 1;
    }
    return matches;
  });
  expect(backgroundPixelCount).toBeGreaterThan(1_000);

  const pagination = await page.evaluate(() => {
    const source = [...document.querySelectorAll(".phone-scaler [data-chat-item-id]")]
      .map((node) => ({
        id: node.getAttribute("data-chat-item-id"),
        kind: node.getAttribute("data-item-kind"),
        pointId: node.getAttribute("data-point-id"),
        senderId: node.getAttribute("data-sender-id"),
        side: node.querySelector(".chat-message.is-own") ? "own" : node.querySelector(".chat-message.is-other") ? "other" : null,
      }));
    const exported = [...document.querySelectorAll("[data-export-page] [data-chat-item-id]")]
      .map((node) => ({
        id: node.getAttribute("data-chat-item-id"),
        kind: node.getAttribute("data-item-kind"),
        pointId: node.getAttribute("data-point-id"),
        senderId: node.getAttribute("data-sender-id"),
        side: node.querySelector(".chat-message.is-own") ? "own" : node.querySelector(".chat-message.is-other") ? "other" : null,
      }));
    const event = source.find((item) => item.kind === "event-divider");
    const eventMessages = source.filter((item) => item.kind === "message" && item.pointId === event?.id);
    return {
      source,
      exported,
      eventMessages,
      editorControls: document.querySelectorAll("[data-export-page] .row-delete").length,
      backgroundCount: document.querySelectorAll("[data-export-page] .chat-background-image").length,
      avatarCount: document.querySelectorAll("[data-export-page] .chat-avatar img").length,
      usernameCount: document.querySelectorAll("[data-export-page] .message-name").length,
      whatsappTimeCount: document.querySelectorAll("[data-export-page] .message-time").length,
    };
  });
  expect(pagination.exported).toEqual(pagination.source);
  expect(pagination.eventMessages.map((message) => message.side)).toEqual(["other", "own"]);
  expect(new Set(pagination.eventMessages.map((message) => message.senderId)).size).toBe(2);
  expect(pagination.editorControls).toBe(0);
  expect(pagination.backgroundCount).toBe(pageCount);
  expect(pagination.avatarCount).toBeGreaterThan(0);
  expect(pagination.usernameCount).toBeGreaterThan(0);
  expect(pagination.whatsappTimeCount).toBeGreaterThan(0);
});

test("微信浅色且隐藏用户名时导出单页 PNG", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await startTemplate(page, "微信风格");
  const lightTimeBackground = await page.locator(".phone-scaler .time-divider").evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(lightTimeBackground).toContain("0.82");
  await page.getByRole("button", { name: "导出图片", exact: true }).click();
  await expect(page.getByText("共 1 张", { exact: true })).toBeVisible({ timeout: 60_000 });

  const exported = page.locator(".export-slide img");
  await expect(exported).toHaveCount(1);
  await expect(exported).toHaveJSProperty("naturalWidth", 780);
  await expect(exported).toHaveJSProperty("naturalHeight", 1688);
  expect(await page.locator("[data-export-page] .message-name").count()).toBe(0);
  expect(await page.locator("[data-export-page] .message-time").count()).toBe(0);
  await expect(page.locator("[data-export-page] .chat-phone")).not.toHaveClass(/is-dark/);
});

test("导出树正确展示 Today、Yesterday、同年和跨年日期", async ({ page }) => {
  const project = createProject("whatsapp");
  project.title = "日期矩阵验收";
  project.content.referenceDate = "2026-07-15";
  project.content.items = [
    { id: "today", kind: "time-divider", timestamp: "2026-07-15T08:05" },
    { id: "today-message", kind: "message", senderId: project.content.currentParticipantId, pointId: "today", messageType: "text", content: "今天" },
    { id: "yesterday", kind: "time-divider", timestamp: "2026-07-14T19:20" },
    { id: "yesterday-message", kind: "message", senderId: project.content.participants[1].id, pointId: "yesterday", messageType: "text", content: "昨天" },
    { id: "same-year", kind: "time-divider", timestamp: "2026-03-01T09:15" },
    { id: "same-year-message", kind: "message", senderId: project.content.currentParticipantId, pointId: "same-year", messageType: "text", content: "同年" },
    { id: "cross-year", kind: "time-divider", timestamp: "2025-12-31T23:59" },
    { id: "cross-year-message", kind: "message", senderId: project.content.participants[1].id, pointId: "cross-year", messageType: "text", content: "跨年" },
  ];

  await seedProject(page, project);
  await page.getByRole("button", { name: "导出图片", exact: true }).click();
  await expect(page.getByText("共 1 张", { exact: true })).toBeVisible({ timeout: 60_000 });

  expect(await page.locator("[data-export-page] .time-divider").allTextContents()).toEqual([
    "Today 08:05",
    "Yesterday 19:20",
    "03-01 09:15",
    "2025-12-31 23:59",
  ]);
  expect(await page.locator("[data-export-page] .message-time").allTextContents()).toEqual([
    "08:05",
    "19:20",
    "09:15",
    "23:59",
  ]);
});
