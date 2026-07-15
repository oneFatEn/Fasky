import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { exposeBuildInfo } from "./buildInfo";
import "./styles.css";

exposeBuildInfo();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
