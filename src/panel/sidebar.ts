import type { ComponentPublicInstance, PluginFunction } from "vue";
// eslint-disable-next-line ts/ban-ts-comment
// @ts-ignore The project declares no `*.vue` module, so the import has no type.
import MinimapSidebar from "./components/MinimapSidebar.vue";

/**
 * Mounts the sidebar into the Panel's `k-panel-inside` wrapper by hand, since
 * Kirby offers no slot beside the view.
 */
export const minimapSidebarMixin: PluginFunction<any> = (Vue) => {
  let sidebarComponent: ComponentPublicInstance | undefined;

  Vue.mixin({
    mounted(this: ComponentPublicInstance) {
      if (this.$options.name !== "k-panel-inside") return;

      const SidebarConstructor = Vue.extend(MinimapSidebar);
      sidebarComponent = new SidebarConstructor({ parent: this as any });
      sidebarComponent.$mount();

      this.$el.appendChild(sidebarComponent.$el);
    },
    beforeDestroy(this: ComponentPublicInstance) {
      if (this.$options.name !== "k-panel-inside") return;

      if (sidebarComponent) {
        sidebarComponent.$destroy();
        sidebarComponent = undefined;
      }
    },
  });
};
