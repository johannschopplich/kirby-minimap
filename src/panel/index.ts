import { minimapSidebarPlugin } from "./sidebar";
import "virtual:uno.css";
import "./index.css";

window.panel.plugin("johannschopplich/minimap", {
  use: {
    minimapSidebar: minimapSidebarPlugin,
  },
});
