import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import packageJson from "./package.json";

function getCommitHash() {
  try {
    return execFileSync("git", ["rev-parse", "--short=8", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const commitHash = getCommitHash();
const buildTime = new Date().toISOString();
const buildId = `${packageJson.version}+${commitHash}.${buildTime.replace(/\D/g, "").slice(0, 14)}`;

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_COMMIT__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_ID__: JSON.stringify(buildId),
  },
});
