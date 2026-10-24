import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import {
  attachmentDisplayName,
  attachmentViewUrl,
  isAttachmentImage,
} from '../../utils/attachmentUpload';
import { formatAttachmentSecondaryLine } from '../../utils/timeFormat';

/**
 * Carousel gallery: main preview + left/right arrows + thumbnail strip.
 *
 * @param {{
 *   attachments: object[],
 *   canDelete?: boolean,
 *   deletingId?: string|number|null,
 *   onDelete?: (attachmentId: string|number) => void,
 *   onOpen?: (attachment: object) => void,
 * }} props
 */
export default function AttachmentGallery({
  attachments = [],
  canDelete = false,
  deletingId = null,
  onDelete,
  onOpen,
}) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const rows = useMemo(() => (Array.isArray(attachments) ? attachments : []), [attachments]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(prev => {
      if (!rows.length) return 0;
      return Math.min(prev, rows.length - 1);
    });
  }, [rows]);

  if (!rows.length) return null;

  const current = rows[index] ?? rows[0];
  const currentId = current?.id ?? current?.uuid;
  const currentName = attachmentDisplayName(current);
  const currentUrl = attachmentViewUrl(current);
  const currentIsImage = Boolean(currentUrl) && isAttachmentImage(current);
  const secondary = formatAttachmentSecondaryLine(current);
  const canGoPrev = rows.length > 1;
  const canGoNext = rows.length > 1;

  const goPrev = () => {
    setIndex(prev => (prev <= 0 ? rows.length - 1 : prev - 1));
  };

  const goNext = () => {
    setIndex(prev => (prev >= rows.length - 1 ? 0 : prev + 1));
  };

  const handleOpenCurrent = () => {
    if (onOpen) onOpen(current);
    else if (currentUrl) window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Stack spacing={1.5}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          bgcolor: alpha(accent, 0.04),
        }}
      >
        <Box
          sx={{
            position: 'relative',
            height: { xs: 240, sm: 320 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={handleOpenCurrent}
            aria-label={`Open ${currentName}`}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              p: 0,
              width: '100%',
              height: '100%',
              cursor: currentUrl ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentIsImage ? (
              <Box
                component="img"
                src={currentUrl}
                alt={currentName}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Stack alignItems="center" spacing={1} sx={{ px: 2 }}>
                <InsertDriveFileOutlined sx={{ fontSize: 56, color: accent }} />
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                  {currentName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tap to open
                </Typography>
              </Stack>
            )}
          </Box>

          {canGoPrev ? (
            <IconButton
              aria-label="Previous attachment"
              onClick={goPrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: alpha(theme.palette.background.paper, 0.92),
                boxShadow: 1,
                '&:hover': { bgcolor: theme.palette.background.paper },
              }}
            >
              <ChevronLeftRounded />
            </IconButton>
          ) : null}

          {canGoNext ? (
            <IconButton
              aria-label="Next attachment"
              onClick={goNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: alpha(theme.palette.background.paper, 0.92),
                boxShadow: 1,
                '&:hover': { bgcolor: theme.palette.background.paper },
              }}
            >
              <ChevronRightRounded />
            </IconButton>
          ) : null}

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            {currentUrl ? (
              <Tooltip title="Open full file">
                <IconButton
                  size="small"
                  aria-label="Open full file"
                  onClick={handleOpenCurrent}
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.92),
                    '&:hover': { bgcolor: theme.palette.background.paper },
                  }}
                >
                  <OpenInNewOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ) : null}
            {canDelete && onDelete && currentId != null ? (
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Delete attachment"
                    disabled={deletingId === currentId}
                    onClick={() => onDelete(currentId)}
                    sx={{
                      bgcolor: alpha(theme.palette.background.paper, 0.92),
                      '&:hover': { bgcolor: theme.palette.background.paper },
                    }}
                  >
                    <DeleteOutlineOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.common.black, 0.55),
              color: 'common.white',
              fontWeight: 600,
            }}
          >
            {index + 1} / {rows.length}
          </Typography>
        </Box>

        <Box sx={{ px: 1.5, py: 1.25, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentName}
          </Typography>
          {secondary ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {secondary}
            </Typography>
          ) : null}
        </Box>
      </Paper>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 0.5,
          px: 0.25,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {rows.map((att, i) => {
          const id = att.id ?? att.uuid ?? i;
          const name = attachmentDisplayName(att);
          const url = attachmentViewUrl(att);
          const isImage = Boolean(url) && isAttachmentImage(att);
          const selected = i === index;
          return (
            <Box
              key={id}
              component="button"
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${name}`}
              aria-current={selected ? 'true' : undefined}
              sx={{
                flex: '0 0 auto',
                width: 64,
                height: 64,
                p: 0,
                borderRadius: 1.25,
                border: '2px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                overflow: 'hidden',
                cursor: 'pointer',
                bgcolor: alpha(accent, 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isImage ? (
                <Box
                  component="img"
                  src={url}
                  alt={name}
                  loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <InsertDriveFileOutlined sx={{ fontSize: 22, color: accent }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
