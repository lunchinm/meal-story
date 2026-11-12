import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 打包成一个 index.html，双击就能玩，不依赖服务器。
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    open: false,
  },
});
