import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// 단일 HTML로 인라인: file:// 로도 열리고 어디든(GitHub Pages/Vercel) 그대로 배포 가능
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
