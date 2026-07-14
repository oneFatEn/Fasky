import type { AssetRecord, ChatProject, RecoveryRecord } from "./types";

const DB_NAME = "faksy";
const DB_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | undefined;

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
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("projects")) {
        const projects = database.createObjectStore("projects", { keyPath: "id" });
        projects.createIndex("updatedAt", "updatedAt");
        projects.createIndex("type", "type");
      }
      if (!database.objectStoreNames.contains("assets")) {
        const assets = database.createObjectStore("assets", { keyPath: "id" });
        assets.createIndex("projectId", "projectId");
      }
      if (!database.objectStoreNames.contains("recovery")) {
        database.createObjectStore("recovery", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
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
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveProject(project: ChatProject): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction("projects", "readwrite");
  transaction.objectStore("projects").put(project);
  await transactionDone(transaction);
}

export async function deleteProject(projectId: string): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction(["projects", "assets"], "readwrite");
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
    project,
    savedAt: new Date().toISOString(),
  };
  transaction.objectStore("recovery").put(record);
  await transactionDone(transaction);
}

export async function getRecovery(): Promise<RecoveryRecord | undefined> {
  const database = await openFaksyDB();
  const transaction = database.transaction("recovery", "readonly");
  return requestToPromise(
    transaction.objectStore("recovery").get("current") as IDBRequest<RecoveryRecord | undefined>,
  );
}

export async function clearRecovery(): Promise<void> {
  const database = await openFaksyDB();
  const transaction = database.transaction("recovery", "readwrite");
  transaction.objectStore("recovery").delete("current");
  await transactionDone(transaction);
}

export function resetDatabaseForTests(): void {
  databasePromise = undefined;
}
