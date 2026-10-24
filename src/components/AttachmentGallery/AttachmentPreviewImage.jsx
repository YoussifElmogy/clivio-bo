import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import { heicSourceToPreviewUrl, isAttachmentHeic } from '../../utils/attachmentUpload';

/**
 * Renders an attachment as an image. HEIC/HEIF is converted to JPEG when the
 * browser cannot decode Apple formats (Chrome). Remount with `key={src}`.
 */
export default function AttachmentPreviewImage({
  attachment,
  src,
  alt,
  accent,
  variant = 'main',
  fallbackName = '',
}) {
  const needsHeicConvert = isAttachmentHeic(attachment);
  const [previewSrc, setPreviewSrc] = useState(() => (needsHeicConvert ? '' : src || ''));
  const [loading, setLoading] = useState(() => Boolean(needsHeicConvert && src));
  const [failed, setFailed] = useState(() => !src);

  useEffect(() => {
    if (!needsHeicConvert || !src) return undefined;

    let cancelled = false;
    heicSourceToPreviewUrl(src).then(url => {
      if (cancelled) return;
      if (url) {
        setPreviewSrc(url);
        setFailed(false);
      } else {
        // Last resort: try native decode (Safari / some macOS Chrome builds).
        setPreviewSrc(src);
        setFailed(false);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [src, needsHeicConvert]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ width: '100%', height: '100%' }}>
        <CircularProgress size={variant === 'thumb' ? 18 : 28} thickness={4} />
        {variant === 'main' ? (
          <Typography variant="caption" color="text.secondary">
            Preparing preview…
          </Typography>
        ) : null}
      </Stack>
    );
  }

  if (failed || !previewSrc) {
    if (variant === 'thumb') {
      return <InsertDriveFileOutlined sx={{ fontSize: 22, color: accent }} />;
    }
    return (
      <Stack alignItems="center" spacing={1} sx={{ px: 2 }}>
        <InsertDriveFileOutlined sx={{ fontSize: 56, color: accent }} />
        {fallbackName ? (
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
            {fallbackName}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          Tap to open
        </Typography>
      </Stack>
    );
  }

  return (
    <Box
      component="img"
      src={previewSrc}
      alt={alt}
      loading={variant === 'thumb' ? 'lazy' : undefined}
      onError={() => setFailed(true)}
      sx={
        variant === 'thumb'
          ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
          : {
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
            }
      }
    />
  );
}
