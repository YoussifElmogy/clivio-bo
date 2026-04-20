import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import MedicalServicesOutlined from '@mui/icons-material/MedicalServicesOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import { useTheme } from '@mui/material/styles';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', to: '/', Icon: DashboardRounded },
  { label: 'Branches', to: '/branches', Icon: AccountTreeOutlined },
  { label: 'Doctors', to: '/doctors', Icon: MedicalServicesOutlined },
  { label: 'Assistants', to: '/assistants', Icon: GroupsOutlined },
  { label: 'Configurations', to: '/configuration', Icon: SettingsOutlined },
];

export default function Sidebar({ sidebarWidth = '17.778rem', onNavigate }) {
  const theme = useTheme();
  const location = useLocation();

  const clearDocumentsPreserve = () => {
    try {
      sessionStorage.removeItem('documentsPreserve');
      sessionStorage.removeItem('documentsPageIndex');
      sessionStorage.removeItem('documentsSearch');
      sessionStorage.removeItem('documentsStatus');
      sessionStorage.removeItem('documentsAppliedSearch');
      sessionStorage.removeItem('documentsAppliedStatus');
    } catch {
      // noop
    }
  };

  const activeColor = theme.palette.primary.main;
  const mutedColor = theme.palette.text.primary;

  return (
    <Drawer
      variant="permanent"
      slotProps={{
        paper: {
          sx: {
            width: sidebarWidth,
            bgcolor: 'background.paper',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            paddingBlock: '0.889rem',
            height: '100dvh',
          },
        },
      }}
      sx={{ width: sidebarWidth, flexShrink: 0 }}
    >
      <NavLink
        to="/"
        style={{ textDecoration: 'none' }}
        onClick={clearDocumentsPreserve}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: '0.444rem',
            px: '1.333rem',
            py: '0.889rem',
            cursor: 'pointer',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: '2.4rem',
              height: '2.4rem',
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LocalHospitalRounded sx={{ fontSize: '1.35rem' }} />
          </Box>
          <Box>
            <Box
              component="span"
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'text.primary',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              Clivio
            </Box>
            <Box
              component="span"
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              Clinic Suite
            </Box>
          </Box>
        </Box>
      </NavLink>
      <List sx={{ flex: 1, pt: 0 }}>
        {navItems.map(item => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname === item.to ||
                location.pathname.startsWith(`${item.to}/`);
          const IconComponent = item.Icon;

          return (
            <Box key={item.label}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                {...(item.to === '/' ? { end: true } : {})}
                onClick={() => {
                  clearDocumentsPreserve();
                  if (onNavigate) onNavigate();
                }}
                sx={{
                  mb: '0.444rem',
                  mx: 1,
                  borderRadius: 2,
                  px: '1rem',
                  py: '0.75rem',
                  bgcolor: isActive ? 'rgba(15, 118, 110, 0.08)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(15, 118, 110, 0.06)',
                    '& .MuiListItemText-primary': { color: activeColor },
                  },
                  color: isActive ? activeColor : mutedColor,
                  transition: 'background-color 0.2s, color 0.2s',
                  '& .MuiListItemText-primary': {
                    fontSize: '1rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? activeColor : mutedColor,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '2.25rem', color: 'inherit' }}>
                  <IconComponent
                    sx={{
                      fontSize: '1.35rem',
                      color: isActive ? activeColor : mutedColor,
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Box>
          );
        })}
      </List>
      <Box
        sx={{
          px: '1.333rem',
          py: '0.889rem',
          color: 'text.secondary',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <LocalHospitalRounded sx={{ fontSize: '1.1rem', opacity: 0.85 }} />
        <span>Clivio Clinic Dashboard</span>
      </Box>
    </Drawer>
  );
}
