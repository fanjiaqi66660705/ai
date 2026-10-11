import type { NextConfig } from "next";

// GitHub Pages 部署：
// - output: "export" 产出纯静态文件到 out/
// - CI 构建时通过 BASE_PATH=/ai 注入仓库子路径；本地 dev/build 不设则运行在根路径
// - trailingSlash 保证 Pages 正确解析子路由目录
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
