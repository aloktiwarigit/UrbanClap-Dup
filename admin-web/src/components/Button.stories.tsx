import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Button' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type S = StoryObj<typeof Button>;

export const PrimarySm: S = { args: { variant: 'primary', size: 'sm' } };
export const PrimaryMd: S = { args: { variant: 'primary', size: 'md' } };
export const PrimaryLg: S = { args: { variant: 'primary', size: 'lg' } };
export const Secondary: S = { args: { variant: 'secondary' } };
export const Ghost: S = { args: { variant: 'ghost' } };
export const Disabled: S = { args: { variant: 'primary', disabled: true } };
