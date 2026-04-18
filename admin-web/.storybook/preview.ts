import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#ffffff' },
        { name: 'dark', value: '#0b1220' },
      ],
    },
  },
};

export default preview;
