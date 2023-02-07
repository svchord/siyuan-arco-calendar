import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import { createStyleImportPlugin } from 'vite-plugin-style-import';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        createStyleImportPlugin({
            libs: [
                {
                    libraryName: '@arco-design/web-vue',
                    esModule: true,
                    resolveStyle: (name) => {
                        // css
                        return `@arco-design/web-vue/es/${name}/style/css.js`;
                        // less
                        // return `@arco-design/web-vue/es/${name}/style/index.js`;
                    },
                },
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
