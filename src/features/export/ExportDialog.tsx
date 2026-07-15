import { DownloadSimple, X } from "@phosphor-icons/react";
import { Popup, SpinLoading, Swiper } from "antd-mobile";
import type { ExportResult } from "../../types";

interface ExportDialogProps {
  open: boolean;
  exporting: boolean;
  error?: string;
  results: ExportResult[];
  onClose: () => void;
  onRetry: () => void;
}

export function ExportDialog({ open, exporting, error, results, onClose, onRetry }: ExportDialogProps) {
  const downloadAll = () => {
    results.forEach((result) => {
      const anchor = document.createElement("a");
      anchor.href = result.url;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });
  };

  return (
    <Popup
      visible={open}
      position="bottom"
      bodyClassName="export-dialog-popup"
      closeOnMaskClick={!exporting}
      onMaskClick={onClose}
      onClose={onClose}
    >
      <section className="export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-dialog-title">
        <header className="export-dialog-bar">
          <div><strong id="export-dialog-title">导出图片</strong><span>{exporting ? "正在生成固定尺寸图片" : results.length ? `共 ${results.length} 张` : "生成结果会显示在这里"}</span></div>
          <button disabled={exporting} onClick={onClose} aria-label="关闭导出弹窗" type="button"><X size={19} weight="bold" /></button>
        </header>
        <div className="export-dialog-body">
          {exporting ? (
            <div className="export-loading" role="status">
              <SpinLoading color="primary" style={{ "--size": "34px" }} />
              <strong>正在排版与生成</strong>
              <span>图片会按顺序逐张完成，请稍候。</span>
            </div>
          ) : null}
          {!exporting && error ? (
            <div className="export-error" role="alert">
              <strong>未能完成导出</strong>
              <span>{error}</span>
              <button onClick={onRetry} type="button">重新生成</button>
            </div>
          ) : null}
          {!exporting && !error && results.length ? (
            <div className="export-results-ready">
              <Swiper className="export-swiper" indicatorProps={{ color: "white" }}>
                {results.map((result, index) => (
                  <Swiper.Item key={result.url}>
                    <figure className="export-slide">
                      <img src={result.url} alt={`导出图片第 ${index + 1} 张`} draggable={false} />
                      <a className="export-download" href={result.url} download={result.fileName} aria-label={`下载第 ${index + 1} 张图片`}>
                        <DownloadSimple size={19} weight="bold" />
                      </a>
                      <figcaption>{index + 1} / {results.length}</figcaption>
                    </figure>
                  </Swiper.Item>
                ))}
              </Swiper>
              <button className="export-download-all" onClick={downloadAll} type="button"><DownloadSimple size={18} weight="bold" />下载全部</button>
            </div>
          ) : null}
        </div>
      </section>
    </Popup>
  );
}
