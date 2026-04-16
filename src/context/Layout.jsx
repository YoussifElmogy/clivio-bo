import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from '../components/Sidebar/Sidebar';
import Topbar from '../components/Topbar/Topbar';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';

export default function Layout() {
  const isMobile = useMediaQuery('(max-width:768px)');
  const isTablet = useMediaQuery('(min-width:769px) and (max-width:1023px)');
  const isDesktop = useMediaQuery('(min-width:1024px)');
  // 240px = 13.33rem, 320px = 17.78rem
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarWidth = isTablet ? '14.5rem' : '17.78rem';

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar logic */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Sidebar
            sidebarWidth={sidebarWidth}
            onNavigate={() => setDrawerOpen(false)}
          />
        </Drawer>
      ) : isTablet ? (
        <>
          {/* Overlay */}
          {drawerOpen && (
            <Box
              onClick={() => setDrawerOpen(false)}
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100dvh',
                bgcolor: 'rgba(0,0,0,0.5)',
                zIndex: 1199,
                transition: 'opacity 0.55s',
                cursor: 'pointer',
              }}
            />
          )}
          {/* Sidebar with slide effect */}
          <Box
            sx={{
              width: sidebarWidth,
              flexShrink: 0,
              position: 'fixed',
              left: 0,
              top: 0,
              height: '100dvh',
              zIndex: 1200,
              transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: drawerOpen ? 'auto' : 'none',
            }}
          >
            <Sidebar
              sidebarWidth={sidebarWidth}
              onNavigate={() => setDrawerOpen(false)}
            />
          </Box>
        </>
      ) : (
        <Box
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100dvh',
            zIndex: 1200,
          }}
        >
          <Sidebar sidebarWidth={sidebarWidth} />
        </Box>
      )}
      {/* Main area (with left margin for sidebar) */}
      <Box
        sx={{
          flex: 1,
          ml: isMobile
            ? 0
            : isTablet
              ? drawerOpen
                ? sidebarWidth
                : 0
              : sidebarWidth,
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          width: '100vw',
          minWidth: '16.67rem', // 300px
          transition: 'margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Topbar - fixed */}
        <Box
          sx={{
            position: 'fixed',
            left: isMobile
              ? 0
              : isTablet
                ? drawerOpen
                  ? sidebarWidth
                  : 0
                : sidebarWidth,
            right: 0,
            top: 0,
            zIndex: 1100,
            width: isMobile
              ? '100vw'
              : isTablet
                ? `calc(100vw - ${drawerOpen ? sidebarWidth : 0})`
                : `calc(100vw - ${sidebarWidth})`,
          }}
        >
          <Topbar onMenuClick={() => setDrawerOpen(true)} />
        </Box>
        {/* Content - scrollable */}
        <Box
          sx={{
            flex: 1,
            mt: '4.556rem', // 80px
            p: '1.778rem',
            pb: '5rem',
            overflowY: 'auto',
            height: 'calc(100dvh - 4.556rem)', // 80px
            bgcolor: '#f4f5f7',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
