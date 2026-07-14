import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, IconButton, InputAdornment, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { login } from '../services/authService';
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
      const { token, fullName, email: userEmail, role } = response.data;
      loginUser({ fullName, email: userEmail, role }, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(rgba(10,10,25,0.85), rgba(10,10,25,0.9)), url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: 420,
          p: 5,
          borderRadius: 4,
          backgroundColor: 'rgba(25, 25, 45, 0.75)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
          Welcome Back!
        </Typography>
        <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)" mb={3}>
          Sign in to continue to ProjectFlow
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            variant="filled"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.6)' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            variant="filled"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 1, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.6)' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <FormControlLabel
              control={<Checkbox size="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
              label={<Typography variant="body2" color="rgba(255,255,255,0.7)">Remember me</Typography>}
            />
            <Link to="/forgot-password" style={{ color: '#a78bfa', fontSize: '0.85rem', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </Box>

          <Button
            fullWidth
            type="submit"
            disabled={loading}
            sx={{
              py: 1.3,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <Typography variant="body2" textAlign="center" mt={3} color="rgba(255,255,255,0.7)">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}