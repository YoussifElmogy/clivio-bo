import React, { useId, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined';
import FormFieldLabel from '../FormFieldLabel/FormFieldLabel';
import { toAbsoluteMediaUrl } from '../../configs/mediaUpload';

/**
 * Image file picker with preview. Value is a URL string (e.g. from API) or a `File` to submit with FormData.
 */
export default function ImagePickerField({
  id: idProp,
  label,
  required = false,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled,
}) {
  const reactId = useId();
  const inputId = idProp ?? `image-picker-${reactId}`;
  const [localError, setLocalError] = useState(null);

  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewSrc(typeof value === 'string' && value ? toAbsoluteMediaUrl(value) : '');
  }, [value]);

  const displaySrc = previewSrc;
  const showError = Boolean(error || localError);
  const message = localError || helperText;

  const handleChange = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled) return;
    setLocalError(null);
    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLocalError('Image must be 8 MB or smaller');
      return;
    }
    onChange(file);
    onBlur?.();
  };

  return (
    <Box>
      <FormFieldLabel htmlFor={inputId} required={required}>
        {label}
      </FormFieldLabel>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          gap: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: showError ? 'error.main' : 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', sm: 140 },
            height: 140,
            flexShrink: 0,
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {displaySrc ? (
            <Box
              component="img"
              src={displaySrc}
              alt=""
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          ) : (
            <AddPhotoAlternateOutlined sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            hidden
            disabled={disabled}
            onChange={handleChange}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="outlined"
              component="label"
              htmlFor={inputId}
              disabled={disabled}
              sx={{ borderRadius: 2 }}
            >
              {displaySrc ? 'Replace image' : 'Choose image'}
            </Button>
          </Box>
          {(showError || !displaySrc) && (
            <FormHelperText error={showError} sx={{ mx: 0 }}>
              {showError ? message : 'PNG, JPG, WebP — up to 8 MB'}
            </FormHelperText>
          )}
        </Box>
      </Box>
    </Box>
  );
}
