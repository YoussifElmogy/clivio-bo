import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import MedicalServicesOutlined from '@mui/icons-material/MedicalServicesOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import MedicalInformationOutlined from '@mui/icons-material/MedicalInformationOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import FlashOnOutlined from '@mui/icons-material/FlashOnOutlined';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import { useTheme } from '@mui/material/styles';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import DropdownMenu from '../DropdownMenu/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import usePermissions from '../../hooks/usePermissions';
import { PERM } from '../../config/permissions';

const navItems = [
  { label: 'Overview', to: '/', Icon: DashboardRounded },
  {
    label: 'Doctors',
    to: '/doctors',
    Icon: MedicalServicesOutlined,
    requiresPermission: PERM.VIEW_DOCTOR,
  },
  {
    label: 'Assistants',
    to: '/assistants',
    Icon: GroupsOutlined,
    requiresPermission: PERM.VIEW_ASSISTANT,
  },
  {
    label: 'Patients',
    to: '/patients',
    Icon: PersonOutlineOutlined,
    requiresPermission: PERM.VIEW_PATIENT,
  },
  {
    label: 'Appointments',
    to: '/appointments',
    Icon: EventAvailableOutlined,
    requiresPermission: PERM.VIEW_APPOINTMENT,
  },
  {
    label: 'Schedules',
    to: '/schedules',
    Icon: CalendarMonthOutlined,
    requiresPermission: PERM.VIEW_APPOINTMENT,
  },
  {
    label: 'Branches',
    to: '/branches',
    Icon: AccountTreeOutlined,
    requiresPermission: PERM.VIEW_BRANCH,
  },
  {
    label: 'Services',
    to: '/services',
    Icon: MedicalInformationOutlined,
    requiresPermission: PERM.VIEW_INVENTORY,
  },
  {
    label: 'Inventory',
    to: '/inventory',
    Icon: Inventory2Outlined,
    requiresPermission: PERM.VIEW_INVENTORY,
  },
  {
    label: 'Laser',
    to: '/laser',
    Icon: FlashOnOutlined,
    requiresPermission: PERM.VIEW_LASER,
  },
  {
    label: 'Configurations',
    to: '/configuration',
    Icon: SettingsOutlined,
    requiresPermission: PERM.VIEW_CONFIG,
  },
];

export default function Sidebar({ sidebarWidth = '17.778rem', onNavigate }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { can } = usePermissions();

  const visibleNavItems = navItems.filter(item => {
    if (!item.requiresPermission) return true;
    return can(item.requiresPermission);
  });

  const accountMenuItems = [
    {
      label: 'Change password',
      onClick: () => navigate('/change-password'),
    },
    {
      label: 'Log out',
      onClick: () => logout(),
      sx: { color: 'error.main' },
    },
  ];

  const displayName = user?.fullName || user?.username || 'Account';
  const displayRole = user?.role || '';

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
        {visibleNavItems.map(item => {
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
          px: '1rem',
          py: '0.889rem',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <DropdownMenu menuItems={accountMenuItems}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: 2,
              px: 0.75,
              py: 0.75,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'text.primary',
                  lineHeight: 1.25,
                }}
              >
                {displayName}
              </Typography>
              {displayRole ? (
                <Typography
                  noWrap
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 0.125,
                  }}
                >
                  {displayRole}
                </Typography>
              ) : null}
            </Box>
            <KeyboardArrowDownIcon sx={{ fontSize: '1.35rem', color: 'text.secondary', flexShrink: 0 }} />
          </Box>
        </DropdownMenu>
      </Box>
    </Drawer>
  );
}
