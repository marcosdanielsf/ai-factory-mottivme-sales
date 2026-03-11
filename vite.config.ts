import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // Proxy /docs para o VitePress em 5173
        "/docs": {
          target: "http://localhost:5173",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/docs/, ""),
        },
        // Proxy cold-call-bot Railway API (evita CORS)
        "/cold-call-api": {
          target: "https://cold-call-bot-production.up.railway.app",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cold-call-api/, ""),
          secure: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      minify: "terser",
      sourcemap: false,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-icons": ["lucide-react"],
            "vendor-charts": ["recharts"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-three": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],
            "vendor-genai": ["@google/genai"],
            "vendor-sentry": ["@sentry/react"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
