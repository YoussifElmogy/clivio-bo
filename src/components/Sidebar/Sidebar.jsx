import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import { useTheme } from '@mui/material/styles';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Overview', to: '/', Icon: DashboardRounded },
  { label: 'Users', to: '/users', Icon: PeopleAltOutlined },
];

export default function Sidebar({ sidebarWidth = '17.778rem', onNavigate }) {
  const theme = useTheme();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    'Agent Hub': location.pathname.startsWith('/agent-hub'),
    Configurations: location.pathname.startsWith('/configurations'),
  });

  const clearDocumentsPreserve = () => {
    try {
      sessionStorage.removeItem('documentsPreserve');
      sessionStorage.removeItem('documentsPageIndex');
      sessionStorage.removeItem('documentsSearch');
      sessionStorage.removeItem('documentsStatus');
      sessionStorage.removeItem('documentsAppliedSearch');
      sessionStorage.removeItem('documentsAppliedStatus');
    } catch (e) {
      // noop
    }
  };

  const filteredNavItems = navItems
    .filter(item => {
      if (item.label === 'Users') {
        return true;
      }
      return true;
    })
    .map(item => {
      if (item.hasSubItems && item.label === 'Configurations') {
        const filteredSubItems = item.subItems.filter(subItem => {
          if (subItem.label === 'Identity & Appearance') {
            return true;
          }
          return true;
        });
        return { ...item, subItems: filteredSubItems };
      }
      return item;
    });

  React.useEffect(() => {
    setOpenMenus(prev => ({
      'Agent Hub': location.pathname.startsWith('/agent-hub'),
      Configurations: location.pathname.startsWith('/configurations'),
    }));
  }, [location.pathname]);

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
        {filteredNavItems.map(item => {
          const isActive = location.pathname === item.to;
          const isMainItemActive = item.hasSubItems ? false : isActive;
          const IconComponent = item.Icon;

          return (
            <Box key={item.label}>
              <ListItemButton
                component={item.hasSubItems ? 'div' : NavLink}
                to={item.hasSubItems ? undefined : item.to}
                {...(!item.hasSubItems && item.to === '/' ? { end: true } : {})}
                onClick={
                  item.hasSubItems
                    ? () => {
                        setOpenMenus(prev => {
                          const newState = {
                            'Agent Hub': false,
                            Configurations: false,
                          };
                          newState[item.label] = !prev[item.label];
                          return newState;
                        });
                      }
                    : () => {
                        clearDocumentsPreserve();
                        setOpenMenus({
                          'Agent Hub': false,
                          Configurations: false,
                        });
                        if (onNavigate) onNavigate();
                      }
                }
                sx={{
                  mb: item.hasSubItems && openMenus[item.label] ? '0' : '0.444rem',
                  mx: 1,
                  borderRadius: 2,
                  px: '1rem',
                  py: '0.75rem',
                  bgcolor: isMainItemActive ? 'rgba(15, 118, 110, 0.08)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(15, 118, 110, 0.06)',
                    '& .MuiListItemText-primary': { color: activeColor },
                  },
                  color: isMainItemActive ? activeColor : mutedColor,
                  transition: 'background-color 0.2s, color 0.2s',
                  '& .MuiListItemText-primary': {
                    fontSize: '1rem',
                    fontWeight: isMainItemActive ? 600 : 500,
                    color: isMainItemActive ? activeColor : mutedColor,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: '2.25rem', color: 'inherit' }}>
                  <IconComponent
                    sx={{
                      fontSize: '1.35rem',
                      color: isMainItemActive ? activeColor : mutedColor,
                    }}
                  />
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.hasSubItems &&
                  (openMenus[item.label] ? (
                    <ExpandLess sx={{ color: mutedColor }} />
                  ) : (
                    <ExpandMore sx={{ color: mutedColor }} />
                  ))}
              </ListItemButton>

              {item.hasSubItems && (
                <Collapse in={openMenus[item.label]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map(subItem => {
                      const isSubItemActive = location.pathname === subItem.to;
                      return (
                        <ListItemButton
                          key={subItem.label}
                          component={NavLink}
                          to={subItem.to}
                          onClick={() => {
                            clearDocumentsPreserve();
                            if (onNavigate) onNavigate();
                          }}
                          sx={{
                            pl: '3.5rem',
                            pr: '1.333rem',
                            py: '0.389rem',
                            mb: '0.444rem',
                            borderRadius: 2,
                            mx: 1,
                            bgcolor: 'transparent',
                            '&:hover': {
                              bgcolor: 'rgba(15, 118, 110, 0.06)',
                              '& .MuiListItemText-primary': {
                                color: activeColor,
                              },
                            },
                            '& .MuiListItemText-primary': {
                              fontSize: '0.9375rem',
                              color: isSubItemActive ? activeColor : mutedColor,
                              fontWeight: isSubItemActive ? 600 : 400,
                            },
                          }}
                        >
                          <ListItemText primary={subItem.label} />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
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
