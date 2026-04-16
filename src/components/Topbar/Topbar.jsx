import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DropdownMenu from '../DropdownMenu/DropdownMenu';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ onMenuClick }) {
  const isMobile = useMediaQuery('(max-width:1023px)');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Change Password',
      onClick: () => navigate('/change-password'),
    },
    {
      label: 'Logout',
      onClick: () => logout(),
      sx: { color: 'error.main' },
    },
  ];

  const displayName = user?.fullName || user?.username || 'User';
  const displayRole = user?.role || '';

  const trigger = (
    <Box sx={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box mr="0.556rem">
          <Typography
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1rem',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </Typography>
          {displayRole ? (
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: 'text.secondary',
                mt: '-0.11rem',
              }}
            >
              {displayRole}
            </Typography>
          ) : null}
        </Box>
        <KeyboardArrowDownIcon sx={{ fontSize: '1.56rem', color: 'text.primary' }} />
      </Box>
    </Box>
  );

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        height: '4.556rem !important',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        pl: '1.778rem',
        pr: { xs: 2, sm: '3.778rem' },
        py: '0.889rem',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          height: '100%',
          minHeight: 'auto !important',
          p: '0rem !important',
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: '0.11rem', color: 'primary.main' }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />
        <DropdownMenu menuItems={menuItems}>{trigger}</DropdownMenu>
      </Toolbar>
    </AppBar>
  );
}
