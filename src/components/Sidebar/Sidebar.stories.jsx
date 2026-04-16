import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

export default {
  title: 'Dashboard/Sidebar',
  component: Sidebar,
};

export const Interactive = () => {
  const [activeTab, setActiveTab] = useState('Documents');
  return (
    <ThemeProvider theme={theme}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
    </ThemeProvider>
  );
};
