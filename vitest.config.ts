import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@atlas/mcp-iot-bridge': path.resolve(__dirname, './packages/atlas-mcp-bridge/src/index.ts'),
    },
  },
});
