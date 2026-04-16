import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function CustomMoreHorizIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="3.5" cy="12" r="2.25" />
      <circle cx="12" cy="12" r="2.25" />
      <circle cx="20.5" cy="12" r="2.25" />
    </SvgIcon>
  );
}
