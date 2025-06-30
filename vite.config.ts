import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],

  //解决“vite use `--host` to expose”
  base: "./", //不加打包后白屏
  server: {
    host: "localhost",
    port: 9527,
    open: true,
    proxy: {
      "/api/bili": {
        target: "https://api.bilibili.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bili/, ""),
        configure: (proxy, _options) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Referer", "https://www.bilibili.com");
            proxyReq.setHeader("Host", "api.bilibili.com");
          });
        },
      },
    },
  },
  resolve: {
    //别名配置，引用src路径下的东西可以通过@如：import Layout from '@/layout/index.vue'
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "src"),
      },
    ],
  },
});
