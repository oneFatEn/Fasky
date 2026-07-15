export const BUILD_INFO = Object.freeze({
  version: __APP_VERSION__,
  commit: __BUILD_COMMIT__,
  builtAt: __BUILD_TIME__,
  id: __BUILD_ID__,
});

export function exposeBuildInfo() {
  document.documentElement.dataset.buildId = BUILD_INFO.id;

  const meta = document.createElement("meta");
  meta.name = "faksy-build";
  meta.content = BUILD_INFO.id;
  document.head.append(meta);
}
