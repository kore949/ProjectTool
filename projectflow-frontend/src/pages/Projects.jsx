import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Menu, MenuItem, Grid,
  InputAdornment, Select, FormControl, InputLabel,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Search, Folder, CheckCircle, WarningAmber } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, updateProject, deleteProject } from '../services/dataService';

const statusColors = {
  'Active': { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
  'Completed': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  'On Hold': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Cancelled': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

function StatChip({ icon, label, value, color }) {
  return (
    <Paper sx={{ p: 2, borderRadius: '14px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>{label}</Typography>
      </Box>
    </Paper>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const canManage = role === 'admin' || role === 'project manager';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuProject, setMenuProject] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load projects', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const openCreateDialog = () => {
    setEditingProject(null);
    setForm({ name: '', description: '', startDate: '', endDate: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setForm({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate?.split('T')[0] || '',
      endDate: project.endDate?.split('T')[0] || '',
    });
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleSave = async () => {
    try {
      if (editingProject) {
        await updateProject(editingProject.projectId, {
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          status: editingProject.status,
        });
        setSnackbar({ open: true, message: 'Project updated', severity: 'success' });
      } else {
        await createProject({
          name: form.name,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        setSnackbar({ open: true, message: 'Project created', severity: 'success' });
      }
      setDialogOpen(false);
      loadProjects();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save project', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(menuProject.projectId);
      setSnackbar({ open: true, message: 'Project deleted', severity: 'success' });
      setMenuAnchor(null);
      loadProjects();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete project', severity: 'error' });
    }
  };

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'Active').length,
    completed: projects.filter((p) => p.status === 'Completed').length,
    onHold: projects.filter((p) => p.status === 'On Hold').length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase())
        || p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Projects</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>Plan, track, and deliver all your projects in one place</Typography>
        </Box>
        {canManage && (
          <Button
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', color: 'white',
              textTransform: 'none', borderRadius: 2, px: 2.5,
              '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
            }}
          >
            New Project
          </Button>
        )}
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatChip icon={<Folder sx={{ color: '#a78bfa' }} />} label="Total Projects" value={stats.total} color="#a78bfa" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<CheckCircle sx={{ color: '#4ade80' }} />} label="Active" value={stats.active} color="#4ade80" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<WarningAmber sx={{ color: '#fbbf24' }} />} label="On Hold" value={stats.onHold} color="#fbbf24" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<CheckCircle sx={{ color: '#60a5fa' }} />} label="Completed" value={stats.completed} color="#60a5fa" />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 220, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160, backgroundColor: '#1E293B', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#94A3B8' }}>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ color: 'white' }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="On Hold">On Hold</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, backgroundColor: '#14142b', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <TableContainer sx={{ backgroundColor: '#14142b' }}>
          <Table sx={{ backgroundColor: '#14142b' }}>
            <TableHead>
              <TableRow>
                {['Project', 'Status', 'Start Date', 'Due Date', ''].map((h) => (
                  <TableCell key={h} sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filteredProjects.map((project) => {
                const style = statusColors[project.status] || statusColors['Active'];
                return (
                  <TableRow key={project.projectId} hover sx={{ backgroundColor: '#14142b' }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{project.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{project.description}</Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <Chip label={project.status} size="small" sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      {canManage && (
                        <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuProject(project); }}>
                          <MoreVert sx={{ color: 'rgba(255,255,255,0.6)' }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filteredProjects.length === 0 && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)' }} textAlign="center" py={4}>
            {projects.length === 0 ? 'No projects yet.' : 'No projects match your search.'}
          </Typography>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => openEditDialog(menuProject)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#f87171' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Project Name" margin="normal" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            fullWidth label="Description" margin="normal" multiline rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            fullWidth label="Start Date" type="date" margin="normal" InputLabelProps={{ shrink: true }}
            value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <TextField
            fullWidth label="End Date" type="date" margin="normal" InputLabelProps={{ shrink: true }}
            value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}