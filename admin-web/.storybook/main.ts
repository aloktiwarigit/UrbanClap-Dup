import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // @storybook/react-vite does not automatically wire up the JSX runtime or
  // the "@/*" path alias the way the app's own vitest.config.ts does — every
  // JSX story throws "ReferenceError: React is not defined" and any story
  // importing through "@/..." fails module resolution without this (E01-S07).
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [react()],
      resolve: {
        alias: {
          // Storybook loads this config as CJS via esbuild-register, so
          // import.meta.url isn't available here; resolve from cwd instead
          // (Storybook is always invoked from the admin-web package root).
          '@': path.resolve(process.cwd(), 'src'),
        },
      },
    }),
};
export default config;
