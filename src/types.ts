export type ProjectType = "chat" | "forum" | "tweet" | "sms" | "danmaku";
export type TemplateId = "wechat" | "whatsapp";
export type Appearance = "light" | "dark";

export interface ExportConfig {
  width: number;
  height: number;
  pixelRatio: number;
}

export interface ThemeConfig {
  appearance: Appearance;
}

export interface Participant {
  id: string;
  displayName: string;
  avatarAssetId?: string;
  bubbleColor: string;
  textColor: string;
}

export interface MessageItem {
  id: string;
  kind: "message";
  senderId: string;
  pointId: string;
  messageType: "text" | "image" | "sticker";
  content: string;
}

export interface TimeDividerItem {
  id: string;
  kind: "time-divider";
  timestamp: string | null;
  legacyLabel?: string;
  requiresConfirmation?: true;
}

export interface EventDividerItem {
  id: string;
  kind: "event-divider";
  content: string;
}

export type DialoguePointItem = TimeDividerItem | EventDividerItem;
export type ChatItem = MessageItem | DialoguePointItem;

export interface ChatDocument {
  templateId: TemplateId;
  conversationTitle: string;
  currentParticipantId: string;
  referenceDate: string;
  participants: Participant[];
  items: ChatItem[];
  showUsernames: boolean;
  backgroundAssetId?: string;
}

export interface ChatProject {
  id: string;
  schemaVersion: number;
  type: "chat";
  title: string;
  createdAt: string;
  updatedAt: string;
  content: ChatDocument;
  theme: ThemeConfig;
  export: ExportConfig;
}

export interface AssetRecord {
  id: string;
  projectId: string;
  blob: Blob;
  name: string;
  mimeType: string;
  createdAt: string;
}

export interface RecoveryRecord {
  id: "current";
  project: ChatProject;
  savedAt: string;
}

export interface ExportResult {
  fileName: string;
  url: string;
  blob: Blob;
}

export type EditorTab = "content" | "people" | "style" | "canvas";
export type AppView = "home" | "editor" | "drafts";
