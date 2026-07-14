import { useEffect, useMemo, useState } from "react";
import { getAsset } from "../../db";
import type { ChatProject } from "../../types";

export function useAssetUrls(project?: ChatProject) {
  const assetIds = useMemo(() => {
    if (!project) return [];
    const ids = project.content.participants.flatMap((person) =>
      person.avatarAssetId ? [person.avatarAssetId] : [],
    );
    if (project.content.backgroundAssetId) ids.push(project.content.backgroundAssetId);
    return [...new Set(ids)];
  }, [project]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const nextUrls: Record<string, string> = {};

    void Promise.all(
      assetIds.map(async (id) => {
        const asset = await getAsset(id);
        if (asset) nextUrls[id] = URL.createObjectURL(asset.blob);
      }),
    ).then(() => {
      if (cancelled) {
        Object.values(nextUrls).forEach(URL.revokeObjectURL);
        return;
      }
      setUrls((previous) => {
        Object.values(previous).forEach(URL.revokeObjectURL);
        return nextUrls;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [assetIds.join("|")]);

  useEffect(
    () => () => {
      Object.values(urls).forEach(URL.revokeObjectURL);
    },
    [urls],
  );

  return urls;
}
