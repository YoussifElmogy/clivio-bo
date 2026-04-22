import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, styled } from '@mui/material/styles';
import { Controller } from 'react-hook-form';

function formatTimeMain(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

const TimeMain = styled(Typography)(({ theme }) => ({
  fontSize: '1.05rem',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
  fontFamily: theme.typography.fontFamily,
}));

function normalizeTimeSlot(slot) {
  if (typeof slot === 'string') {
    const t = String(slot).trim();
    return { time: t.length >= 5 ? t.slice(0, 5) : t, available: true };
  }
  const raw = String(slot?.time ?? '').trim();
  const time = raw.length >= 5 ? raw.slice(0, 5) : raw;
  return {
    time,
    available: slot?.available !== false,
  };
}

export default function SlotTimeField({ control, timeSlots, loading, appointmentDay, timeRequired }) {
  const hasDay = Boolean(appointmentDay?.trim());

  return (
    <Stack
      id="registration-field-appointmentTime"
      spacing={2}
      sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.35, flexWrap: 'wrap' }}>
          <Typography
            variant="subtitle1"
            component="span"
            sx={{
              fontWeight: 600,
              letterSpacing: '-0.03em',
              fontSize: '1.05rem',
            }}
          >
            Preferred time
          </Typography>
          {timeRequired ? (
            <Typography
              component="span"
              color="error"
              sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}
              aria-hidden
            >
              *
            </Typography>
          ) : null}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 520, lineHeight: 1.7, fontSize: '0.875rem' }}
        >
          Fine-tune your visit start. Unavailable times are shown but cannot be selected.
        </Typography>
      </Box>

      <Controller
        name="appointmentTime"
        control={control}
        render={({ field, fieldState }) => (
          <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
            {!hasDay ? (
              <Box
                sx={{
                  py: 2.5,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: alpha('#000', 0.02),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Choose a date above to unlock available times.
                </Typography>
              </Box>
            ) : loading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  py: 4,
                  justifyContent: 'center',
                  borderRadius: 3,
                  border: '1px dashed',
                  borderColor: 'divider',
                  bgcolor: alpha('#fff', 0.5),
                }}
              >
                <CircularProgress size={24} thickness={4} />
                <Typography variant="body2" color="text.secondary">
                  Loading schedule…
                </Typography>
              </Box>
            ) : timeSlots.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: alpha('#000', 0.03),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No openings on this day. Select another date or call the clinic.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                  },
                  gap: 1.25,
                  width: '100%',
                }}
              >
                {timeSlots.map(raw => {
                  const { time: t, available } = normalizeTimeSlot(raw);
                  if (!t) return null;
                  const fv = String(field.value ?? '').trim().slice(0, 5);
                  const selected = available && fv === t;
                  const main = formatTimeMain(t);
                  return (
                    <Box
                      key={t}
                      component="button"
                      type="button"
                      disabled={!available}
                      onClick={() => field.onChange(t)}
                      aria-disabled={!available}
                      aria-pressed={selected}
                      sx={theme => ({
                        border: '1px solid',
                        borderColor: selected ? 'transparent' : alpha(theme.palette.divider, 0.95),
                        borderRadius: 2,
                        py: 1.75,
                        px: 1.5,
                        cursor: available ? 'pointer' : 'not-allowed',
                        background: selected
                          ? `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 70%)`
                          : available
                            ? alpha(theme.palette.background.paper, 0.9)
                            : alpha(theme.palette.action.disabledBackground, 0.35),
                        color: selected
                          ? theme.palette.primary.contrastText
                          : available
                            ? theme.palette.text.primary
                            : theme.palette.text.disabled,
                        opacity: available ? 1 : 0.55,
                        boxShadow: selected
                          ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.28)}`
                          : `0 1px 4px ${alpha(theme.palette.common.black, 0.05)}`,
                        transition: theme.transitions.create(
                          ['box-shadow', 'transform', 'border-color', 'opacity'],
                          { duration: theme.transitions.duration.shorter }
                        ),
                        ...(available
                          ? {
                              '&:hover': {
                                borderColor: selected ? 'transparent' : alpha(theme.palette.primary.main, 0.4),
                                boxShadow: selected
                                  ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.32)}`
                                  : `0 6px 16px ${alpha(theme.palette.common.black, 0.08)}`,
                                transform: 'translateY(-1px)',
                              },
                            }
                          : {}),
                        '&:focus-visible': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        },
                      })}
                    >
                      <TimeMain component="span" sx={{ color: selected ? '#fff' : undefined }}>
                        {main}
                      </TimeMain>
                    </Box>
                  );
                })}
              </Box>
            )}
            {fieldState.error ? (
              <Typography variant="caption" color="error" sx={{ mt: 1.5, display: 'block' }}>
                {fieldState.error.message}
              </Typography>
            ) : null}
          </Box>
        )}
      />
    </Stack>
  );
}
