import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createProject } from "../../defaultProject";
import { ExportRenderTree, MeasureRenderTree } from "./ExportRenderTree";

vi.mock("antd-mobile", () => ({
  Avatar: ({ alt, className, fallback, src }: { alt: string; className: string; fallback: React.ReactNode; src: string }) => (
    <span aria-label={alt} className={className}>{src ? <img alt="" src={src} /> : fallback}</span>
  ),
}));

describe("export asset rendering", () => {
  it("renders the uploaded background as a real image on every export page", () => {
    const project = createProject("whatsapp");
    project.content.backgroundAssetId = "background-id";
    const pages = [project.content.items.slice(0, 2), project.content.items.slice(2)];

    const markup = renderToStaticMarkup(
      <ExportRenderTree
        project={project}
        pages={pages}
        assetUrls={{ "background-id": "blob:https://faksy.test/background" }}
      />,
    );

    expect(markup.match(/class="chat-background-image"/g)).toHaveLength(2);
    expect(markup.match(/src="blob:https:\/\/faksy.test\/background"/g)).toHaveLength(2);
  });

  it("uses the same uploaded background in the measurement and capacity trees", () => {
    const project = createProject("wechat");
    project.content.backgroundAssetId = "background-id";

    const markup = renderToStaticMarkup(
      <MeasureRenderTree
        project={project}
        assetUrls={{ "background-id": "blob:https://faksy.test/background" }}
      />,
    );

    expect(markup.match(/class="chat-background-image"/g)).toHaveLength(2);
  });

  it("does not render an empty background image when no upload is selected", () => {
    const project = createProject("wechat");
    const markup = renderToStaticMarkup(
      <ExportRenderTree project={project} pages={[project.content.items]} assetUrls={{}} />,
    );
    expect(markup).not.toContain("chat-background-image");
  });
});
