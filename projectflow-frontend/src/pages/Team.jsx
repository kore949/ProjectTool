import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Chip, TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getUsers } from '../services/dataService';

const roleColors = {
  'Admin': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  'Project Manager': { bg: 'rgba(139,92,246,0.15)', color: '#c084fc' },
  'Team Member': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await getUsers();
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Team</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>See who's on your team and their roles</Typography>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder="Search team members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
      />

      {loading ? (
        <Typography sx={{ color: '#94A3B8' }}>Loading team...</Typography>
      ) : filtered.length === 0 ? (
        <Typography sx={{ color: '#94A3B8' }}>No team members found.</Typography>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((u) => {
            const style = roleColors[u.role] || roleColors['Team Member'];
            return (
              <Grid item xs={12} sm={6} md={4} key={u.userId}>
                <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '1.5rem' }}>
                    {u.fullName?.[0]}
                  </Avatar>
                  <Typography variant="body1" fontWeight="700" sx={{ color: '#ffffff' }}>{u.fullName}</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>{u.email}</Typography>
                  <Chip label={u.role} size="small" sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 600 }} />
                  <Box sx={{ mt: 1.5 }}>
                    <Chip
                      label={u.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        backgroundColor: u.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                        color: u.isActive ? '#4ade80' : '#94A3B8',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}