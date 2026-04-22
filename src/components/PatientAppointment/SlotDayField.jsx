import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';
import { Controller } from 'react-hook-form';

function DayTooltipCard({ heading, body, variant }) {
  const accent =
    variant === 'ok'
      ? alpha('#7dffc4', 0.95)
      : variant === 'muted'
        ? alpha('#b0b8b4', 0.95)
        : alpha('#ffb4a9', 0.95);
  return (
    <Stack spacing={0.85} sx={{ py: 0.35, px: 0.15, maxWidth: 288 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.62rem',
          color: alpha('#fff', 0.72),
        }}
      >
        {heading}
      </Typography>
      <Box
        sx={{
          width: 28,
          height: 3,
          borderRadius: 999,
          bgcolor: accent,
          opacity: 0.95,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          lineHeight: 1.5,
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.8125rem',
        }}
      >
        {body}
      </Typography>
    </Stack>
  );
}

function AppointmentPickerDay({ slotDaySet, minDate, maxDate, ...props }) {
  const { day, outsideCurrentMonth, disabled, ...pickerProps } = props;
  const iso = dayjs(day).format('YYYY-MM-DD');
  const d = dayjs(day).startOf('day');

  if (outsideCurrentMonth) {
    return (
      <PickerDay
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        disabled={disabled}
        {...pickerProps}
      />
    );
  }

  let title = null;
  if (disabled) {
    let body =
      'This date cannot be selected. Try another day or contact reception.';
    if (d.isBefore(minDate, 'day')) {
      body = 'Past dates cannot be booked.';
    } else if (d.isAfter(maxDate, 'day')) {
      body = 'Online booking is limited to the next 3 months from today.';
    } else if (!slotDaySet.has(iso)) {
      body =
        'No visits on this day for your branch or doctor. Try another date or contact reception.';
    }
    title = <DayTooltipCard heading="Not available" body={body} variant="muted" />;
  } else {
    title = (
      <DayTooltipCard
        heading="Open day"
        body="Select this date, then choose an available time in the next step."
        variant="ok"
      />
    );
  }

  const dayEl = (
    <PickerDay
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      disabled={disabled}
      {...pickerProps}
    />
  );

  return (
    <Tooltip
      arrow
      describeChild
      enterDelay={disabled ? 200 : 350}
      enterNextDelay={200}
      placement="top"
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: { offset: [0, -6] },
            },
          ],
        },
        tooltip: {
          sx: theme => ({
            bgcolor: alpha('#0f1412', 0.94),
            color: '#fff',
            borderRadius: 2,
            px: 1.75,
            py: 1.25,
            boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.35)}`,
            border: `1px solid ${alpha('#fff', 0.08)}`,
            backdropFilter: 'blur(10px)',
            maxWidth: 320,
          }),
        },
        arrow: {
          sx: {
            color: alpha('#0f1412', 0.94),
            '&::before': {
              border: `1px solid ${alpha('#fff', 0.08)}`,
            },
          },
        },
      }}
      title={title}
    >
      <span
        style={{
          display: 'inline-flex',
          verticalAlign: 'middle',
        }}
      >
        {dayEl}
      </span>
    </Tooltip>
  );
}

export default function SlotDayField({ control, slotDays, loading, hasDoctor, branchSelected }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setPickerOpen(false);
  }, [branchSelected, loading, slotDays.length]);

  const slotDaySet = useMemo(() => new Set(slotDays ?? []), [slotDays]);
  const minDate = dayjs().startOf('day');
  const maxDate = dayjs().add(3, 'month').startOf('day');

  const shouldDisableDate = useMemo(
    () => date => {
      const d = dayjs(date).startOf('day');
      const min = dayjs().startOf('day');
      const max = dayjs().add(3, 'month').startOf('day');
      if (d.isBefore(min, 'day')) return true;
      if (d.isAfter(max, 'day')) return true;
      const iso = d.format('YYYY-MM-DD');
      return !slotDaySet.has(iso);
    },
    [slotDaySet]
  );

  const daySlot = useMemo(
    () => pickerProps => (
      <AppointmentPickerDay
        {...pickerProps}
        slotDaySet={slotDaySet}
        minDate={minDate}
        maxDate={maxDate}
      />
    ),
    [slotDaySet, minDate, maxDate]
  );

  return (
    <Stack
      id="registration-field-appointmentDay"
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
            Preferred day
          </Typography>
          <Typography
            component="span"
            color="error"
            sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}
            aria-hidden
          >
            *
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.75, maxWidth: 520, lineHeight: 1.7, fontSize: '0.875rem' }}
        >
          {hasDoctor
            ? 'Pick a date within the next 3 months, then choose a time below.'
            : 'Pick a date within the next 3 months. Only days with visits are enabled.'}
        </Typography>
      </Box>

      <Controller
        name="appointmentDay"
        control={control}
        render={({ field, fieldState }) => (
          <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
            {!branchSelected ? (
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
                  Select a clinic location first — open days are loaded for that branch.
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
                  Loading open days…
                </Typography>
              </Box>
            ) : slotDays.length === 0 ? (
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
                  No days available for this selected branch. Try another branch or contact reception.
                </Typography>
              </Box>
            ) : (
              <DatePicker
                open={pickerOpen}
                onOpen={() => setPickerOpen(true)}
                onClose={() => setPickerOpen(false)}
                value={field.value ? dayjs(field.value) : null}
                onChange={v => {
                  field.onChange(v && dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD') : '');
                }}
                format="ddd, D MMM YYYY"
                minDate={minDate}
                maxDate={maxDate}
                shouldDisableDate={shouldDisableDate}
                slots={{ day: daySlot }}
                slotProps={{
                  textField: {
                    id: 'registration-field-appointmentDay-input',
                    fullWidth: true,
                    readOnly: true,
                    error: Boolean(fieldState.error),
                    helperText: fieldState.error?.message,
                    placeholder: 'Select your day',
                    onClick: () => setPickerOpen(true),
                    onPaste: e => e.preventDefault(),
                    onKeyDown: e => {
                      if (e.key === 'Tab' || e.key === 'Escape') return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPickerOpen(true);
                        return;
                      }
                      e.preventDefault();
                    },
                    inputProps: {
                      'aria-label': 'Preferred appointment day',
                      readOnly: true,
                      autoComplete: 'off',
                      inputMode: 'none',
                    },
                    slotProps: {
                      input: {
                        notched: false,
                      },
                    },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        bgcolor: alpha('#fff', 0.85),
                        cursor: 'pointer',
                      },
                      '& .MuiInputBase-input': {
                        cursor: 'pointer',
                        caretColor: 'transparent',
                      },
                    },
                  },
                  openPickerButton: {
                    'aria-label': 'Open calendar',
                    onClick: e => {
                      e.stopPropagation();
                      setPickerOpen(true);
                    },
                  },
                }}
              />
            )}
          </Box>
        )}
      />
    </Stack>
  );
}
