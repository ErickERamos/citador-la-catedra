import { defineConfig, build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, existsSync } from "fs";

function chromeExtensionBuild() {
  let outDir: string;

  return {
    name: "chrome-extension-build",
    configResolved(config: { build: { outDir: string } }) {
      outDir = config.build.outDir;
    },
    async writeBundle() {
      // Build background service worker (IIFE)
      await viteBuild({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir,
          lib: {
            entry: resolve(__dirname, "src/background/service-worker.ts"),
            name: "serviceWorker",
            formats: ["iife"],
            fileName: () => "service-worker.js",
          },
          rollupOptions: {
            output: {
              extend: true,
            },
          },
        },
      });

      // Build content script (IIFE)
      await viteBuild({
        configFile: false,
        build: {
          emptyOutDir: false,
          outDir: resolve(outDir, "content"),
          lib: {
            entry: resolve(__dirname, "src/content/extractor.ts"),
            name: "extractor",
            formats: ["iife"],
            fileName: () => "extractor.js",
          },
          rollupOptions: {
            output: {
              extend: true,
            },
          },
        },
      });

      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(outDir, "manifest.json")
      );

      // Copy icons
      const iconsDir = resolve(outDir, "icons");
      if (!existsSync(iconsDir)) {
        mkdirSync(iconsDir, { recursive: true });
      }
      const iconSizes = ["icon16.png", "icon48.png", "icon128.png"];
      for (const icon of iconSizes) {
        const src = resolve(__dirname, "public/icons", icon);
        if (existsSync(src)) {
          copyFileSync(src, resolve(iconsDir, icon));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), chromeExtensionBuild()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
      },
    },
  },
});
