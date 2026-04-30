import MinimapSidebar from "./components/MinimapSidebar.vue";
import "virtual:uno.css";
import "./index.css";

window.panel.plugin("johannschopplich/minimap", {
  use: [
    function minimapInjectionMixin(Vue) {
      let minimapComponent;

      Vue.mixin({
        mounted() {
          if (this.$options.name !== "k-panel-inside") return;

          const MinimapSidebarConstructor = Vue.extend(MinimapSidebar);
          minimapComponent = new MinimapSidebarConstructor({ parent: this });
          minimapComponent.$mount();

          this.$el.appendChild(minimapComponent.$el);
        },
        beforeDestroy() {
          if (this.$options.name !== "k-panel-inside") return;

          if (minimapComponent) {
            minimapComponent.$destroy();
            minimapComponent = undefined;
          }
        },
      });
    },
  ],
});
