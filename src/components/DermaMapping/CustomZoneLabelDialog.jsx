import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

export default function CustomZoneLabelDialog({ open, initialLabel = '', onClose, onConfirm }) {
  const theme = useTheme();
  const [label, setLabel] = useState(initialLabel);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(initialLabel);
      setTouched(false);
    }
  }, [open, initialLabel]);

  const trimmed = label.trim();
  const showError = touched && !trimmed;

  const handleConfirm = () => {
    setTouched(true);
    if (!trimmed) return;
    onConfirm?.(trimmed);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Typography variant="overline" color="secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          Additional zone
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {initialLabel ? 'Edit label' : 'Name this area'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Use a clear label for areas outside the face map.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          required
          label="Area label"
          placeholder="e.g. Neck"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => setTouched(true)}
          error={showError}
          helperText={showError ? 'Label is required' : ' '}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.04),
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button variant="contained" color="secondary" onClick={handleConfirm} sx={{ borderRadius: 2, minWidth: 100 }}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
