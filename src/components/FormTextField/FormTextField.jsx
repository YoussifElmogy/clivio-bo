import React, { useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import { useForkRef } from '@mui/material/utils';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';
import { normalizeHexForPicker } from '../../utils/colorHex';

function useOpenNativeTimePicker(inputRef) {
  return useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        // Secure context or browser blocked — fall through
      }
    }
    el.focus();
  }, [inputRef]);
}

function placeholderSx(theme) {
  return {
    '& .MuiOutlinedInput-root': { borderRadius: 2 },
    '& .MuiOutlinedInput-input::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 0.42,
    },
    '& .MuiInputBase-inputMultiline::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 0.42,
    },
  };
}

const colorInputStyle = disabled => ({
  width: 40,
  height: 32,
  border: 'none',
  padding: 0,
  cursor: disabled ? 'default' : 'pointer',
  background: 'transparent',
});

/**
 * Native time input — one clock icon comes from the browser; full-field click opens via `showPicker()` / focus.
 */
function FormTextFieldTime({
  field,
  id,
  label,
  required,
  placeholder,
  invalid,
  errorMessage,
  disabled,
  sx: sxBase,
}) {
  const value = field.value ?? '';
  const { ref: fieldRef, onClick: fieldOnClick, ...fieldRest } = field;
  const inputRef = useRef(null);
  const handleInputRef = useForkRef(inputRef, fieldRef);
  const openPicker = useOpenNativeTimePicker(inputRef);

  const handleRootClick = useCallback(
    event => {
      fieldOnClick?.(event);
      if (disabled) return;
      if (event.target.closest?.('.MuiFormHelperText-root')) return;
      openPicker();
    },
    [disabled, fieldOnClick, openPicker]
  );

  const timeSx = {
    ...sxBase,
    '& .MuiOutlinedInput-root': {
      ...(sxBase['& .MuiOutlinedInput-root'] || {}),
      cursor: disabled ? 'default' : 'pointer',
      transition: theme => theme.transitions.create(['border-color', 'box-shadow', 'background-color'], {
        duration: theme.transitions.duration.shorter,
      }),
      ...(disabled
        ? {}
        : {
            '&:hover': {
              bgcolor: 'action.hover',
            },
            '&.Mui-focused': {
              bgcolor: 'action.hover',
            },
          }),
    },
    '& input[type="time"]': {
      cursor: disabled ? 'default' : 'pointer',
      fontVariantNumeric: 'tabular-nums',
      fontSize: '1rem',
      py: 1.25,
    },
    '& input[type="time"]::-webkit-calendar-picker-indicator': {
      cursor: 'pointer',
      opacity: 1,
      filter: theme => (theme.palette.mode === 'dark' ? 'invert(0.88)' : 'none'),
    },
  };

  return (
    <Box>
      <FormFieldLabel htmlFor={id} required={required}>
        {label}
      </FormFieldLabel>
      <TextField
        {...fieldRest}
        value={value}
        id={id}
        hiddenLabel
        fullWidth
        type="time"
        placeholder={placeholder}
        error={invalid}
        helperText={errorMessage}
        disabled={disabled}
        onClick={handleRootClick}
        inputRef={handleInputRef}
        slotProps={{
          htmlInput: {
            step: 300,
            'aria-label': label,
          },
        }}
        sx={timeSx}
      />
    </Box>
  );
}

/**
 * Label + outlined TextField (hidden floating label). Optional native color picker via `colorPicker`.
 */
export default function FormTextField({
  field,
  id,
  label,
  required = false,
  placeholder,
  invalid = false,
  errorMessage,
  disabled = false,
  multiline = false,
  minRows,
  colorPicker = false,
  type,
}) {
  const theme = useTheme();
  const value = field.value ?? '';
  const sx = placeholderSx(theme);

  if (colorPicker) {
    const emptyFallback = colorPicker.emptyFallback ?? '#000000';
    return (
      <Box>
        <FormFieldLabel htmlFor={id} required={required}>
          {label}
        </FormFieldLabel>
        <TextField
          {...field}
          value={value}
          id={id}
          hiddenLabel
          fullWidth
          placeholder={placeholder}
          error={invalid}
          helperText={errorMessage}
          disabled={disabled}
          sx={sx}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                  <input
                    type="color"
                    aria-label={`Pick ${label}`}
                    value={normalizeHexForPicker(value, emptyFallback)}
                    onChange={e => field.onChange(e.target.value)}
                    disabled={disabled}
                    style={colorInputStyle(disabled)}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    );
  }

  if (type === 'time') {
    return (
      <FormTextFieldTime
        field={field}
        id={id}
        label={label}
        required={required}
        placeholder={placeholder}
        invalid={invalid}
        errorMessage={errorMessage}
        disabled={disabled}
        sx={sx}
      />
    );
  }

  return (
    <Box>
      <FormFieldLabel htmlFor={id} required={required}>
        {label}
      </FormFieldLabel>
      <TextField
        {...field}
        value={value}
        id={id}
        hiddenLabel
        fullWidth
        type={type}
        placeholder={placeholder}
        multiline={multiline}
        minRows={minRows}
        error={invalid}
        helperText={errorMessage}
        disabled={disabled}
        sx={sx}
      />
    </Box>
  );
}
