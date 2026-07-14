import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl,
  Snackbar, Alert, Switch, Avatar
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { getUsers, createUser, bulkSetUserStatus } from '../services/dataService';

const roleColors = {
  'Admin': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  'Project Manager': { bg: 'rgba(139,92,246,0.15)', color: '#c084fc' },
  'Team Member': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Team Member' });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleActive = async (u) => {
    try {
      await bulkSetUserStatus([u.userId], !u.isActive);
      setSnackbar({ open: true, message: `User ${!u.isActive ? 'activated' : 'deactivated'}`, severity: 'success' });
      loadUsers();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleCreate = async () => {
    try {
      await createUser({
        fullName: form.fullName,
        email: form.email,
        passwordHash: form.password,
        role: form.role,
      });
      setSnackbar({ open: true, message: 'User created', severity: 'success' });
      setDialogOpen(false);
      setForm({ fullName: '', email: '', password: '', role: 'Team Member' });
      loadUsers();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create user', severity: 'error' });
    }
  };

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Users</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Manage all users, roles, and account status</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 240, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        <Button
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          sx={{
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
            textTransform: 'none', borderRadius: 2, px: 3,
            '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
          }}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['User', 'Email', 'Role', 'Status', 'Active/Inactive'].map(h => (
                  <TableCell key={h} sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.08)' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filtered.map((u) => {
                const style = roleColors[u.role] || roleColors['Team Member'];
                return (
                  <TableRow key={u.userId} hover>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.85rem' }}>
                          {u.fullName?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff' }}>{u.fullName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.08)' }}>{u.email}</TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Chip label={u.role} size="small" sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Chip
                        label={u.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          backgroundColor: u.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                          color: u.isActive ? '#4ade80' : '#94A3B8', fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <Switch checked={u.isActive} onChange={() => handleToggleActive(u)} color="success" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filtered.length === 0 && (
          <Typography sx={{ color: '#94A3B8' }} textAlign="center" py={4}>No users found.</Typography>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Full Name" margin="normal" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <TextField fullWidth label="Email" margin="normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField fullWidth label="Temporary Password" type="password" margin="normal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Project Manager">Project Manager</MenuItem>
              <MenuItem value="Team Member">Team Member</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}