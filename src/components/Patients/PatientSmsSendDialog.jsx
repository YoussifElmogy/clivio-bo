import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SmsOutlined from '@mui/icons-material/SmsOutlined';

/**
 * @param {{
 *   open: boolean,
 *   recipients: Array<{ id: number|string, name: string, mobile?: string|null }>,
 *   message: string,
 *   submitting?: boolean,
 *   onClose: () => void,
 *   onMessageChange: (value: string) => void,
 *   onSubmit: () => void,
 * }} props
 */
export default function PatientSmsSendDialog({
  open,
  recipients = [],
  message,
  submitting = false,
  onClose,
  onMessageChange,
  onSubmit,
}) {
  const count = recipients.length;
  const previewNames = recipients.slice(0, 6);
  const extraCount = Math.max(0, count - previewNames.length);

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      aria-labelledby="patient-sms-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="patient-sms-dialog-title" sx={{ pb: 1 }}>
        Send SMS
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Message will be sent to{' '}
            <strong>
              {count} patient{count === 1 ? '' : 's'}
            </strong>
            .
          </Typography>

          {count > 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                maxHeight: 120,
                overflowY: 'auto',
                p: 1.25,
                borderRadius: 2,
                border: theme => `1px solid ${theme.palette.divider}`,
                bgcolor: 'action.hover',
              }}
            >
              {previewNames.map(r => (
                <Chip
                  key={r.id}
                  size="small"
                  label={r.mobile ? `${r.name} · ${r.mobile}` : r.name}
                  sx={{ maxWidth: '100%' }}
                />
              ))}
              {extraCount > 0 ? (
                <Chip size="small" variant="outlined" label={`+${extraCount} more`} />
              ) : null}
            </Box>
          ) : null}

          <TextField
            label="Message"
            placeholder="Your appointment is confirmed for tomorrow at 10:00 AM."
            value={message}
            onChange={e => onMessageChange(e.target.value)}
            disabled={submitting}
            multiline
            minRows={4}
            maxRows={8}
            fullWidth
            required
            autoFocus
            helperText={`${String(message).length} characters`}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting || count === 0 || !String(message).trim()}
          startIcon={
            submitting ? (
              <CircularProgress size={18} thickness={5} color="inherit" aria-hidden />
            ) : (
              <SmsOutlined />
            )
          }
          sx={{ borderRadius: 2 }}
        >
          {submitting ? 'Sending…' : 'Send SMS'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
