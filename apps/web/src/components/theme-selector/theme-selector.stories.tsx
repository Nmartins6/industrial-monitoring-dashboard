import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ThemeSelector } from './theme-selector';

const meta = {
  title: 'Componentes/ThemeSelector',
  component: ThemeSelector,
} satisfies Meta<typeof ThemeSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
