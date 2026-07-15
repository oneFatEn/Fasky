import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProject } from "./defaultProject";
import {
  clearRecovery,
  deleteProject,
  FAKSY_DB_VERSION,
  getAsset,
  getRecovery,
  listProjects,
  openFaksyDB,
  resetDatabaseForTests,
  saveAsset,
  saveProject,
  saveRecovery,
} from "./db";

function installFreshIndexedDB(): void {
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: new IDBFactory(),
  });
  Object.defineProperty(globalThis, "IDBKeyRange", {
    configurable: true,
    value: IDBKeyRange,
  });
}

function openLegacyV1Database(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("faksy", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore("projects", { keyPath: "id" });
      database.createObjectStore("assets", { keyPath: "id" });
      database.createObjectStore("recovery", { keyPath: "id" });
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

describe("Faksy IndexedDB", () => {
  beforeEach(() => {
    resetDatabaseForTests();
    installFreshIndexedDB();
  });

  afterEach(() => resetDatabaseForTests());

  it("upgrades a v1 database through the explicit migration and restores its indexes", async () => {
    await openLegacyV1Database();

    const database = await openFaksyDB();

    expect(database.version).toBe(FAKSY_DB_VERSION);
    const transaction = database.transaction(["projects", "assets", "recovery"], "readonly");
    expect([...transaction.objectStore("projects").indexNames]).toEqual(["type", "updatedAt"]);
    expect([...transaction.objectStore("assets").indexNames]).toEqual(["projectId"]);
  });

  it("restores a saved draft, recovery snapshot, avatar, and background after reopening", async () => {
    const project = createProject("whatsapp");
    const avatar = new Blob(["avatar"], { type: "image/png" });
    const background = new Blob(["background"], { type: "image/webp" });
    const avatarId = await saveAsset(project.id, avatar, "avatar.png");
    const backgroundId = await saveAsset(project.id, background, "background.webp");
    project.content.participants[0].avatarAssetId = avatarId;
    project.content.backgroundAssetId = backgroundId;
    await saveProject(project);
    await saveRecovery(project);

    resetDatabaseForTests();

    const [draft] = await listProjects();
    const recovery = await getRecovery();
    const restoredAvatar = await getAsset(avatarId);
    const restoredBackground = await getAsset(backgroundId);
    expect(draft.content.participants[0].avatarAssetId).toBe(avatarId);
    expect(draft.content.backgroundAssetId).toBe(backgroundId);
    expect(recovery?.project.id).toBe(project.id);
    expect(await restoredAvatar?.blob.text()).toBe("avatar");
    expect(await restoredBackground?.blob.text()).toBe("background");
  });

  it("deletes only the selected project's assets and matching recovery snapshot", async () => {
    const deletedProject = createProject("wechat");
    const retainedProject = createProject("whatsapp");
    const deletedAssetId = await saveAsset(deletedProject.id, new Blob(["delete"]), "delete.png");
    const retainedAssetId = await saveAsset(retainedProject.id, new Blob(["keep"]), "keep.png");
    await saveProject(deletedProject);
    await saveProject(retainedProject);
    await saveRecovery(deletedProject);

    await deleteProject(deletedProject.id);

    expect((await listProjects()).map((project) => project.id)).toEqual([retainedProject.id]);
    expect(await getAsset(deletedAssetId)).toBeUndefined();
    expect(await getAsset(retainedAssetId)).toBeDefined();
    expect(await getRecovery()).toBeUndefined();
  });

  it("clears recovery without deleting the saved draft or its assets", async () => {
    const project = createProject("wechat");
    const assetId = await saveAsset(project.id, new Blob(["keep"]), "keep.png");
    await saveProject(project);
    await saveRecovery(project);

    await clearRecovery();

    expect(await getRecovery()).toBeUndefined();
    expect(await getAsset(assetId)).toBeDefined();
    expect(await listProjects()).toHaveLength(1);
  });
});
