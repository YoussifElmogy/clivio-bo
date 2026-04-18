import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';
import { normalizeHexForPicker } from '../../utils/colorHex';

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
