import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ArcoResolver()]
        }),
        Components({
            resolvers: [
                ArcoResolver({
                    sideEffect: true
                })
            ]
        }),
        cssInjectedByJsPlugin()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            // 本地开发环境通过代理实现跨域，生产环境使用 nginx 转发
            // 正则表达式写法
            '^/api': {
                target: 'http://127.0.0.1:6806', // 后端服务实际地址
                changeOrigin: true //开启代理
            }
        }
    },
    build: {
        assetsDir: '',
        outDir: 'calendar',
        emptyOutDir: false,
        lib: {
            entry: 'src/main.ts',
            formats: ['cjs'],
            fileName: 'main'
        },
        rollupOptions: {
            external: ['siyuan']
        }
    }
})
