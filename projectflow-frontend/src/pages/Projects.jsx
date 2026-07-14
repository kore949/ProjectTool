import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Menu, MenuItem
} from '@mui/material';
import { Add, MoreVert, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, updateProject, deleteProject } from '../services/dataService';

const statusColors = {
  'Active': { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
  'Completed': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  'On Hold': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Cancelled': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

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

  return (
    <Box>
      <Box
        sx={{
          height: 140,
          borderRadius: 3,
          mb: 3,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          p: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#ffffff' }}>Plan, Track, Deliver</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Manage all your projects in one place</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="white">Projects</Typography>
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
              {!loading && projects.map((project) => {
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
        {!loading && projects.length === 0 && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)' }} textAlign="center" py={4}>No projects yet.</Typography>
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