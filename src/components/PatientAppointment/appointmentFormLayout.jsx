import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function FormSection({ number, title, children }) {
  return (
    <Box sx={{ py: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              lineHeight: 1,
            }}
          >
            {number}
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Box>
  );
}

export function SectionDivider() {
  return <Divider flexItem sx={{ borderStyle: 'dashed', opacity: 0.85 }} />;
}

export function AppointmentFormSkeleton({ withStatusSection = false }) {
  return (
    <Box aria-busy aria-label="Loading form">
      <Box sx={{ py: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={220} height={28} />
        </Stack>
        <Stack spacing={3.25}>
          <Stack spacing={1.25}>
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          </Stack>
          <Stack spacing={1.25}>
            <Skeleton variant="text" width={100} height={24} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          </Stack>
        </Stack>
      </Box>
      <SectionDivider />
      <Box sx={{ py: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={260} height={28} />
        </Stack>
        <Stack spacing={3.25}>
          <Stack spacing={1.25}>
            <Skeleton variant="text" width={140} height={24} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: 3 }} />
          </Stack>
          <Stack spacing={1.25}>
            <Skeleton variant="text" width={160} height={24} />
            <Skeleton variant="text" width="100%" height={20} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: 1.25,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
              ))}
            </Box>
          </Stack>
        </Stack>
      </Box>
      {withStatusSection ? (
        <>
          <SectionDivider />
          <Box sx={{ py: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.25 }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="text" width={120} height={28} />
            </Stack>
            <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: 2 }} />
          </Box>
        </>
      ) : null}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Skeleton variant="rounded" width={96} height={40} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rounded" width={160} height={40} sx={{ borderRadius: 2 }} />
      </Stack>
    </Box>
  );
}
