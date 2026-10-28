import type { App, ComponentPublicInstance } from "vue";
import { usePanel } from "kirbyuse";
import { h, render } from "vue";
import MinimapSidebar from "./components/MinimapSidebar.vue";
import { SUPPORTED_VIEW_COMPONENTS } from "./constants";

/**
 * Mounts the sidebar into the Panel's `k-panel-inside` element by hand, since
 * Kirby offers no slot beside the view. Overriding `k-panel-inside` instead
 * would copy a template that changes with Kirby, and a second plugin
 * overriding it would replace ours.
 */
export function minimapSidebarPlugin(app: App) {
  app.mixin({
    mounted(this: ComponentPublicInstance) {
      if (!isPanelInside(this)) return;

      const panel = usePanel();
      if (!SUPPORTED_VIEW_COMPONENTS.has(panel.view.component ?? "")) return;

      const vnode = h(MinimapSidebar);
      // Lets the sidebar resolve the components Kirby registers globally.
      vnode.appContext = this.$.appContext;
      render(vnode, this.$el);
    },
    unmounted(this: ComponentPublicInstance) {
      if (isPanelInside(this)) render(null, this.$el);
    },
  });
}

// The view and `k-panel` share the element of `k-panel-inside`, so only the
// component itself tells the three apart.
function isPanelInside(instance: ComponentPublicInstance) {
  return instance.$.type === instance.$.appContext.components["k-panel-inside"];
}
