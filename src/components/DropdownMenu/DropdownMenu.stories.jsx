import React from 'react';
import DropdownMenu from './DropdownMenu';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

const theme = createTheme();

export default {
  title: 'Dashboard/DropdownMenu',
  component: DropdownMenu,
  decorators: [
    Story => (
      <ThemeProvider theme={theme}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  argTypes: {
    menuItems: { control: 'object' },
    children: { control: false },
  },
};

const sampleMenuItems = [
  { label: 'Profile' },
  { label: 'My account' },
  { label: 'Logout' },
];

const Template = args => (
  <DropdownMenu {...args}>
    <Button id="story-button" variant="contained">
      Open Menu
    </Button>
  </DropdownMenu>
);

export const Default = Template.bind({});
Default.args = {
  menuItems: sampleMenuItems,
};
