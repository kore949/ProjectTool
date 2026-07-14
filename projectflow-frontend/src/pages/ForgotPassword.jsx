import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, IconButton, InputAdornment, Alert } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { forgotPassword, resetPassword } from '../services/authService';

export default function ForgotPassword() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fieldSx = { mb: 2, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.6)' } };
  const iconSx = { color: 'rgba(255,255,255,0.5)' };

  useEffect(() => {
    if (step === 'done') {
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setStep('reset');
      setSuccess(`Verification code sent to ${email}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword({ email, otpCode, newPassword, confirmNewPassword });
      setStep('done');
      setSuccess('Password reset successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
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
        {step === 'done' ? (
          <>
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={2}>
              All Set!
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
            <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)">
              Redirecting you to sign in...
            </Typography>
          </>
        ) : step === 'request' ? (
          <>
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
              Forgot Password?
            </Typography>
            <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)" mb={3}>
              Enter your email to receive a reset code
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleRequest}>
              <TextField
                fullWidth label="Email Address" variant="filled" value={email}
                onChange={(e) => setEmail(e.target.value)} required sx={{ ...fieldSx, mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={iconSx} /></InputAdornment> }}
              />
              <Button
                fullWidth type="submit" disabled={loading}
                sx={{
                  py: 1.3, borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  color: 'white', fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                  '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
              Reset Password
            </Typography>
            {success && <Alert severity="info" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleReset}>
              <TextField
                fullWidth label="Verification Code" variant="filled" value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)} required sx={fieldSx}
                inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center' } }}
              />
              <TextField
                fullWidth label="New Password" type={showPassword ? 'text' : 'password'} variant="filled"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required sx={fieldSx}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={iconSx} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} sx={iconSx}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth label="Confirm New Password" type={showPassword ? 'text' : 'password'} variant="filled"
                value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required
                sx={{ ...fieldSx, mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={iconSx} /></InputAdornment> }}
              />
              <Button
                fullWidth type="submit" disabled={loading}
                sx={{
                  py: 1.3, borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  color: 'white', fontWeight: 'bold', textTransform: 'none', fontSize: '1rem',
                  '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}

        {step !== 'done' && (
          <Typography variant="body2" textAlign="center" mt={3} color="rgba(255,255,255,0.7)">
            <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 'bold' }}>
              Back to Sign In
            </Link>
          </Typography>
        )}
      </Paper>
    </Box>
  );
}