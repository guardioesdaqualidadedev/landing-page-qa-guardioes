import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite + React. A configuração de teste unitário (Vitest) mora aqui também:
// mesmo pipeline de build, sem um segundo arquivo de config para manter.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // O SDK do Firebase responde por boa parte do bundle e quase nunca muda.
        // Separá-lo do código da aplicação mantém o cache do visitante válido
        // entre deploys.
        manualChunks: { firebase: ["firebase/app", "firebase/analytics", "firebase/firestore"] },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.js"],
    include: ["tests/unit/**/*.test.{js,jsx}"],
    css: false,
  },
});
