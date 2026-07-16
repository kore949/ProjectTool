import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, IconButton, InputAdornment,
  Checkbox, FormControlLabel, Alert, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Bolt } from '@mui/icons-material';
import { login, googleLogin, microsoftLogin } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login({ email, password });
      const { token, userId, fullName, email: userEmail, role } = response.data;
      loginUser({ userId, fullName, email: userEmail, role }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth login
  const handleGoogleLogin = () => {
    googleLogin();
  };

  // Microsoft OAuth login
  const handleMicrosoftLogin = () => {
    microsoftLogin();
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        fontFamily: 'Manrope, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* LEFT: Hero image */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          position: 'relative',
          alignItems: 'flex-end',
          backgroundImage:
            'linear-gradient(rgba(10,10,25,0.35), rgba(10,10,25,0.75)), url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minWidth: 0,
        }}
      >
        <Box sx={{ p: { md: 6, lg: 8 }, pb: { md: 8, lg: 10 }, maxWidth: 560 }}>
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{ color: 'white', lineHeight: 1.15, mb: 2 }}
          >
            Plan Projects.
            <br />
            Track Progress.
            <br />
            <Box component="span" sx={{ color: '#a78bfa' }}>
              Deliver Results.
            </Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            ProjectFlow helps teams collaborate efficiently, manage tasks, and achieve goals on time.
          </Typography>
        </Box>
      </Box>

      {/* RIGHT: Login panel — scrollable if needed, but fits viewport */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f23',
          width: { xs: '100%', md: 480 },
          minWidth: { md: 480 },
          flexShrink: 0,
          overflowY: 'auto',
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, md: 4 },
            m: { xs: 2, md: 3 },
            borderRadius: 3,
            backgroundColor: 'rgba(25, 25, 45, 0.75)',
            backdropFilter: 'blur(12px)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bolt sx={{ color: '#7c3aed', fontSize: 28 }} />
            </Box>
          </Box>

          <Typography
            variant="h5"
            fontWeight="800"
            textAlign="center"
            mb={0.5}
            sx={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.35rem' }}
          >
            Welcome Back!
          </Typography>
          <Typography
            variant="body2"
            textAlign="center"
            color="rgba(255,255,255,0.7)"
            mb={2}
          >
            Sign in to continue to ProjectFlow
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography
              variant="caption"
              fontWeight="600"
              sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
            >
              Email Address
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your email"
              variant="filled"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="small"
              sx={{ mb: 1.5, mt: 0.3, input: { color: 'white', py: 1 } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="caption"
                fontWeight="600"
                sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
              >
                Password
              </Typography>
              <Link
                to="/forgot-password"
                style={{
                  color: '#a78bfa',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </Box>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              variant="filled"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              sx={{ mb: 1, mt: 0.3, input: { color: 'white', py: 1 } }}
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: 'rgba(255,255,255,0.5)' }}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  defaultChecked
                  sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}
                />
              }
              label={
                <Typography variant="body2" color="rgba(255,255,255,0.7)" fontSize="0.8rem">
                  Remember me
                </Typography>
              }
              sx={{ mb: 1.5 }}
            />

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              size="small"
              sx={{
                py: 1,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #6366F1, #7c3aed)',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  background: 'linear-gradient(90deg, #4f46e5, #6d28d9)',
                },
              }}
            >
              {loading ? 'Signing In...' : 'Sign In →'}
            </Button>
          </form>

          <Divider
            sx={{
              my: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              '&::before, &::after': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <Typography variant="caption" color="rgba(255,255,255,0.5)" fontSize="0.7rem">
              or continue with
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleLogin}
              size="small"
              sx={{
                textTransform: 'none',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                py: 0.8,
                fontSize: '0.85rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleMicrosoftLogin}
              size="small"
              sx={{
                textTransform: 'none',
                color: 'white',
                borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                py: 0.8,
                fontSize: '0.85rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Microsoft
            </Button>
          </Box>

          <Typography
            variant="body2"
            textAlign="center"
            mt={2}
            color="rgba(255,255,255,0.7)"
            fontSize="0.85rem"
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#a78bfa',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}