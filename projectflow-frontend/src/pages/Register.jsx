import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, IconButton, InputAdornment, Alert } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone } from '@mui/icons-material';
import { register, verifyOtp, resendOtp } from '../services/authService';

export default function Register() {
  const [step, setStep] = useState('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ fullName, email, phoneNumber, password, confirmPassword });
      setStep('otp');
      setSuccess('Account created! Check your email for a verification code.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp({ email, otpCode, purpose: 'Registration' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendOtp({ email, purpose: 'Registration' });
      setSuccess('A new code has been sent.');
    } catch (err) {
      setError('Failed to resend code.');
    }
  };

  const fieldSx = { mb: 2, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.6)' } };
  const iconSx = { color: 'rgba(255,255,255,0.5)' };

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
          width: 440,
          p: 5,
          borderRadius: 4,
          backgroundColor: 'rgba(25, 25, 45, 0.75)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {step === 'form' ? (
          <>
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
              Create Account
            </Typography>
            <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)" mb={3}>
              Join ProjectFlow to manage your projects
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleRegister}>
              <TextField
                fullWidth label="Full Name" variant="filled" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={iconSx} /></InputAdornment> }}
              />
              <TextField
                fullWidth label="Email Address" variant="filled" value={email}
                onChange={(e) => setEmail(e.target.value)} required sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={iconSx} /></InputAdornment> }}
              />
              <TextField
                fullWidth label="Phone Number" variant="filled" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)} required sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={iconSx} /></InputAdornment> }}
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} variant="filled"
                value={password} onChange={(e) => setPassword(e.target.value)} required sx={fieldSx}
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
                fullWidth label="Confirm Password" type={showPassword ? 'text' : 'password'} variant="filled"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" mt={3} color="rgba(255,255,255,0.7)">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 'bold' }}>
                Sign in
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={1}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)" mb={3}>
              Enter the 6-digit code sent to {email}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleVerify}>
              <TextField
                fullWidth label="Verification Code" variant="filled" value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)} required sx={{ ...fieldSx, mb: 3 }}
                inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.2rem' } }}
              />

              <Button
                fullWidth type="submit" disabled={loading}
                sx={{
                  py: 1.3, borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  color: 'white', fontWeight: 'bold', textTransform: 'none', fontSize: '1rem', mb: 2,
                  '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
                }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" color="rgba(255,255,255,0.7)">
              Didn't get a code?{' '}
              <span onClick={handleResend} style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 'bold' }}>
                Resend
              </span>
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}