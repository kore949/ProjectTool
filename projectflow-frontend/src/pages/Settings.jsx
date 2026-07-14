import { useState } from 'react';
import { Box, Typography, Paper, Avatar, TextField, Button, Grid, Snackbar, Alert, Divider, IconButton } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, changeMyPassword } from '../services/dataService';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateMyProfile({ fullName, profilePhoto: photoPreview });
      updateUser({ fullName, profilePhoto: photoPreview });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    setSavingPassword(true);
    try {
      await changeMyPassword({ currentPassword, newPassword, confirmNewPassword });
      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to change password', severity: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Settings</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Manage your account and preferences</Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={3}>Profile</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar src={photoPreview} sx={{ width: 80, height: 80, bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '2rem' }}>
                  {!photoPreview && fullName?.[0]}
                </Avatar>
                <IconButton
                  component="label"
                  size="small"
                  sx={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4f46e5' } }}
                >
                  <PhotoCamera sx={{ fontSize: 16, color: '#fff' }} />
                  <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                </IconButton>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>{user?.email}</Typography>
                <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 600 }}>{user?.role}</Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              sx={{
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
                textTransform: 'none', borderRadius: 2, px: 3, py: 1,
                '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
              }}
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={3}>Change Password</Typography>

            <TextField
              fullWidth type="password" label="Current Password" margin="normal"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <TextField
              fullWidth type="password" label="New Password" margin="normal"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              fullWidth type="password" label="Confirm New Password" margin="normal"
              value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              sx={{
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
                textTransform: 'none', borderRadius: 2, px: 3, py: 1,
                '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
              }}
            >
              {savingPassword ? 'Updating...' : 'Change Password'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}