import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function DropdownMenu({ children, menuItems = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = item => {
    if (item.onClick) {
      item.onClick();
    }
    handleClose();
  };

  return (
    <>
      {React.cloneElement(children, {
        'aria-controls': open ? 'dynamic-menu' : undefined,
        'aria-haspopup': 'true',
        'aria-expanded': open ? 'true' : undefined,
        onClick: handleClick,
      })}
      <Menu
        id="dynamic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            'aria-labelledby': children.props.id || 'dynamic-button',
            sx: {
              paddingTop: 0,
              paddingBottom: 0,
              '& .MuiMenuItem-root': {
                px: '0.889rem',
                py: '0.667rem',
              },
            },
          },
          paper: {
            elevation: 0,
            style: {
              borderRadius: '0.667rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.11)',
              minWidth: '9.667rem',
            },
          },
        }}
        marginThreshold={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.label || index}
            onClick={() => !item.disabled && handleItemClick(item)}
            disabled={item.disabled}
            sx={{
              fontSize: '1rem',
              fontWeight: 400,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              ...item.sx, // merge any additional custom styles from item
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
