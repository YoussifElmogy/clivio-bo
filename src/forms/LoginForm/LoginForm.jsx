import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { loginSchema, loginDefaultValues } from '../../schemas/loginSchema';

export default function LoginForm({ onSubmit, submitLabel = 'Sign in' }) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: loginDefaultValues,
    mode: 'onTouched',
  });

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      fontSize: '1.0625rem',
    },
    '& .MuiOutlinedInput-input': {
      py: 2,
      px: 2,
    },
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ width: '100%', minHeight: { xs: 280, sm: 320 } }}
    >
      <Controller
        name="username"
        control={control}
        render={({ field }) => (
          <Box sx={{ mb: 3 }}>
            <Typography
              component="label"
              htmlFor="login-username"
              variant="subtitle1"
              sx={{
                display: 'block',
                mb: 1.25,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1rem',
              }}
            >
              Username
            </Typography>
            <TextField
              {...field}
              id="login-username"
              hiddenLabel
              autoComplete="username"
              fullWidth
              placeholder="Enter your username"
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              disabled={isSubmitting}
              sx={fieldSx}
            />
          </Box>
        )}
      />
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Box sx={{ mb: 1 }}>
            <Typography
              component="label"
              htmlFor="login-password"
              variant="subtitle1"
              sx={{
                display: 'block',
                mb: 1.25,
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1rem',
              }}
            >
              Password
            </Typography>
            <TextField
              {...field}
              id="login-password"
              hiddenLabel
              autoComplete="current-password"
              fullWidth
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              disabled={isSubmitting}
              sx={fieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        onClick={() => setShowPassword(v => !v)}
                        edge="end"
                        size="medium"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        )}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        disabled={isSubmitting}
        sx={{ mt: 3.5, py: 2, fontSize: '1.0625rem' }}
      >
        {isSubmitting ? (
          <CircularProgress size={26} color="inherit" />
        ) : (
          submitLabel
        )}
      </Button>
    </Box>
  );
}
