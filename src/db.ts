import type { AssetRecord, ChatProject, RecoveryRecord } from "./types";
import { migrateChatProject } from "./features/chat/model/chatMigration";

const DB_NAME = "faksy";
export const FAKSY_DB_VERSION = 2;

let databasePromise: Promise<IDBDatabase> | undefined;
let databaseInstance: IDBDatabase | undefined;

type StoreName = "projects" | "assets" | "recovery";

function ensureIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string,
): void {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath);
}

/**
 * Keep every IndexedDB schema transition explicit and additive. A newly created
 * database runs every migration in order, while an older database only runs the
 * transitions newer than its current version.
 */
export function migrateFaksyDatabase(
  database: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
): void {
  if (oldVersion < 1) {
    database.createObjectStore("projects", { keyPath: "id" });
    database.createObjectStore("assets", { keyPath: "id" });
    database.createObjectStore("recovery", { keyPath: "id" });
  }

  if (oldVersion < 2) {
    const stores = new Set<StoreName>(["projects", "assets", "recovery"]);
    for (const storeName of stores) {
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: "id" });
      }
    }
    ensureIndex(transaction.objectStore("projects"), "updatedAt", "updatedAt");
    ensureIndex(transaction.objectStore("projects"), "type", "type");
    ensureIndex(transaction.objectStore("assets"), "projectId", "projectId");
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("浏览器存储操作失败"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("浏览器存储事务失败"));
    transaction.onabort = () => reject(transaction.error ?? new Error("浏览器存储事务已取消"));
  });
}

export function openFaksyDB(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, FAKSY_DB_VERSION);

    request.onupgradeneeded = (event) => {
      migrateFaksyDatabase(
        request.result,
        request.transaction!,
        (event as IDBVersionChangeEvent).oldVersion,
      );
    };

    request.onsuccess = () => {
      databaseInstance = request.result;
      databaseInstance.onversionchange = () => {
        databaseInstance?.close();
        databaseInstance = undefined;
        databasePromise = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      databasePromise = undefined;
      reject(request.error ?? new Error("无法打开浏览器草稿库"));
    };
  });

  return databasePromise;
}

export async function listProjects(): Promise<ChatProject[]> {
  const database = await openFaksyDB();
  const transaction = database.transaction("projects", "readonly");
  const projects = await requestToPromise(
    transaction.objectStore("projects").getAll() as IDBRequest<ChatProject[]>,
  );
  return projects.map(migrateChatProject).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveProject(project: ChatProject): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction("projects", "readwrite");
  transaction.objectStore("projects").put(migrateChatProject(project));
  await transactionDone(transaction);
}

export async function deleteProject(projectId: string): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction(["projects", "assets", "recovery"], "readwrite");
  transaction.objectStore("projects").delete(projectId);
  const assets = transaction.objectStore("assets");
  const index = assets.index("projectId");
  const cursorRequest = index.openCursor(IDBKeyRange.only(projectId));
  cursorRequest.onsuccess = () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  };
  const recovery = transaction.objectStore("recovery");
  const recoveryRequest = recovery.get("current") as IDBRequest<RecoveryRecord | undefined>;
  recoveryRequest.onsuccess = () => {
    if (recoveryRequest.result?.project.id === projectId) recovery.delete("current");
  };
  await transactionDone(transaction);
}

export async function saveAsset(projectId: string, blob: Blob, name: string): Promise<string> {
  const database = await openFaksyDB();
  const id = crypto.randomUUID();
  const record: AssetRecord = {
    id,
    projectId,
    blob,
    name,
    mimeType: blob.type,
    createdAt: new Date().toISOString(),
  };
  const transaction = database.transaction("assets", "readwrite");
  transaction.objectStore("assets").put(record);
  await transactionDone(transaction);
  return id;
}

export async function getAsset(assetId: string): Promise<AssetRecord | undefined> {
  const database = await openFaksyDB();
  const transaction = database.transaction("assets", "readonly");
  return requestToPromise(
    transaction.objectStore("assets").get(assetId) as IDBRequest<AssetRecord | undefined>,
  );
}

export async function saveRecovery(project: ChatProject): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction("recovery", "readwrite");
  const record: RecoveryRecord = {
    id: "current",
    project: migrateChatProject(project),
    savedAt: new Date().toISOString(),
  };
  transaction.objectStore("recovery").put(record);
  await transactionDone(transaction);
}

export async function getRecovery(): Promise<RecoveryRecord | undefined> {
  const database = await openFaksyDB();
  const transaction = database.transaction("recovery", "readonly");
  const recovery = await requestToPromise(
    transaction.objectStore("recovery").get("current") as IDBRequest<RecoveryRecord | undefined>,
  );
  return recovery ? { ...recovery, project: migrateChatProject(recovery.project) } : undefined;
}

export async function clearRecovery(): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction("recovery", "readwrite");
  transaction.objectStore("recovery").delete("current");
  await transactionDone(transaction);
}

export function resetDatabaseForTests(): void {
  databaseInstance?.close();
  databaseInstance = undefined;
  databasePromise = undefined;
}
