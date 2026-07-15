import type { TemplateId } from "./types";

export interface ChatTemplateTokens {
  id: TemplateId;
  name: string;
  description: string;
  canvasBackground: string;
  ownBubble: string;
  ownText: string;
  otherBubble: string;
  otherText: string;
  accent: string;
  headerTone: "neutral" | "brand";
}

export const CHAT_TEMPLATES: Record<TemplateId, ChatTemplateTokens> = {
  wechat: {
    id: "wechat",
    name: "微信风格",
    description: "克制的灰底与紧凑气泡",
    canvasBackground: "#ededed",
    ownBubble: "#95ec69",
    ownText: "#18210f",
    otherBubble: "#ffffff",
    otherText: "#242321",
    accent: "#07c160",
    headerTone: "neutral",
  },
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp 风格",
    description: "柔和暖底与圆润对话",
    canvasBackground: "#efeae2",
    ownBubble: "#d9fdd3",
    ownText: "#17231b",
    otherBubble: "#ffffff",
    otherText: "#202c33",
    accent: "#168c75",
    headerTone: "brand",
  },
};

export const EXPORT_WIDTH = 390;
export const EXPORT_HEIGHT = 844;
export const EXPORT_PIXEL_RATIO = 2;
