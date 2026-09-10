import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './'：构建产物用相对路径，任意静态目录乃至 file:// 均可运行（ADR-0005）
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2019',
  },
  test: {
    environment: 'node', // 只测 src/game/ 纯逻辑（ADR-0005 Q4），无需 DOM
    include: ['src/**/*.test.ts'],
  },
});
