import type { Decorator, Preview } from '@storybook/nextjs-vite';

import '../src/app/globals.css';

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as 'light' | 'dark';

  document.documentElement.dataset.theme = theme;

  return <Story />;
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Tema visual',
      defaultValue: 'light',
      toolbar: {
        title: 'Tema',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Escuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    backgrounds: {
      disable: true,
    },
    controls: {
      expanded: true,
    },
    layout: 'padded',
  },
};

export default preview;
