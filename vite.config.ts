import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import siyuan from 'vite-plugin-siyuan';

// 产物目录、产物名、public/ 监听、元数据搬运、校验、打包，以及 minify
//（watch 不压缩、生产用默认压缩器）都由 siyuan() 负责。
// 这里只剩项目偏好：React、Tailwind、别名。
export default defineConfig({
  plugins: [react(), tailwindcss(), siyuan({ entry: 'src/index.tsx' })],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  build: {
    sourcemap: false,
    target: 'es2022',
  },
});
