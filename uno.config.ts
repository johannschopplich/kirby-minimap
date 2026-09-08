import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [
    presetWind3({
      prefix: "km-",
      preflight: false,
    }),
  ],
  content: {
    filesystem: ["src/panel/**/*.vue"],
  },
});
