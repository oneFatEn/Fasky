import { saveAsset } from "../../../db";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function useProjectAssets(projectId: string, onNotice: (message: string) => void) {
  return async (file?: File): Promise<string | undefined> => {
    if (!file) return undefined;
    if (!file.type.startsWith("image/")) {
      onNotice("请选择图片文件");
      return undefined;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onNotice("图片不能超过 8MB");
      return undefined;
    }

    try {
      return await saveAsset(projectId, file, file.name);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "图片保存失败");
      return undefined;
    }
  };
}
