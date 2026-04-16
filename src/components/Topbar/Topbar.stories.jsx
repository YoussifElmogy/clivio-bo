import Topbar from './Topbar';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

export default {
  title: 'Dashboard/Topbar',
  component: Topbar,
};

export const Default = () => (
  <ThemeProvider theme={theme}>
    <Topbar />
  </ThemeProvider>
);
