import { sidebarPlugin } from "./sidebar";
import "virtual:uno.css";
import "./index.css";

window.panel.plugin("johannschopplich/minimap", {
  use: {
    sidebar: sidebarPlugin,
  },
});
