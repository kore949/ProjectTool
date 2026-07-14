import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, InputLabel, FormControl,
  Snackbar, Alert, Menu, Autocomplete, Avatar, Grid, InputAdornment,
} from '@mui/material';
import { Add, MoreVert, Edit, Delete, Search, Assignment, AutorenewRounded, RateReview, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getTasks, createTask, updateTask, deleteTask, getProjects, getUsers } from '../services/dataService';

const statusColors = {
  'To Do': { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' },
  'In Progress': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  'Review': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Completed': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
};

const priorityColors = { 'High': '#f87171', 'Medium': '#fbbf24', 'Low': '#60a5fa' };

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

export default function Tasks() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const canCreateDelete = role === 'admin' || role === 'project manager';
  const isMember = role === 'team member';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTask, setMenuTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [form, setForm] = useState({
    projectId: '', title: '', description: '', priority: 'Medium', status: 'To Do', dueDate: '', assignedTo: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([getTasks(), getProjects(), getUsers()]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load tasks', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getProjectName = (id) => projects.find(p => p.projectId === id)?.name || '-';
  const getUserById = (id) => users.find(u => u.userId === id);

  // Members only see tasks assigned to them; Admin/PM see everything
  const visibleTasks = isMember ? tasks.filter(t => t.assignedTo === user?.userId) : tasks;

  const stats = useMemo(() => ({
    toDo: visibleTasks.filter(t => t.status === 'To Do').length,
    inProgress: visibleTasks.filter(t => t.status === 'In Progress').length,
    review: visibleTasks.filter(t => t.status === 'Review').length,
    completed: visibleTasks.filter(t => t.status === 'Completed').length,
  }), [visibleTasks]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter((t) => {
      const matchesSearch = t.title?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [visibleTasks, search, statusFilter, priorityFilter]);

  const openCreateDialog = () => {
    setEditingTask(null);
    setForm({ projectId: '', title: '', description: '', priority: 'Medium', status: 'To Do', dueDate: '', assignedTo: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setForm({
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate?.split('T')[0] || '',
      assignedTo: task.assignedTo || '',
    });
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleSave = async () => {
    try {
      if (editingTask) {
        await updateTask(editingTask.taskId, {
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          dueDate: form.dueDate,
          assignedTo: form.assignedTo || null,
        });
        setSnackbar({ open: true, message: 'Task updated', severity: 'success' });
      } else {
        await createTask({
          projectId: form.projectId,
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate,
          assignedTo: form.assignedTo || null,
        });
        setSnackbar({ open: true, message: 'Task created and assigned', severity: 'success' });
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save task', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(menuTask.taskId);
      setSnackbar({ open: true, message: 'Task deleted', severity: 'success' });
      setMenuAnchor(null);
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete task', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>{isMember ? 'My Tasks' : 'Tasks'}</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            {isMember ? 'Tasks assigned to you' : 'Track progress, assign work, and hit your deadlines'}
          </Typography>
        </Box>
        {canCreateDelete && (
          <Button
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', color: 'white',
              textTransform: 'none', borderRadius: 2, px: 2.5,
              '&:hover': { background: 'linear-gradient(90deg, #6d28d9, #9061f9)' },
            }}
          >
            New Task
          </Button>
        )}
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <StatChip icon={<Assignment sx={{ color: 'rgba(255,255,255,0.8)' }} />} label="To Do" value={stats.toDo} color="#ffffff" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<AutorenewRounded sx={{ color: '#60a5fa' }} />} label="In Progress" value={stats.inProgress} color="#60a5fa" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<RateReview sx={{ color: '#fbbf24' }} />} label="Review" value={stats.review} color="#fbbf24" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatChip icon={<CheckCircle sx={{ color: '#4ade80' }} />} label="Completed" value={stats.completed} color="#4ade80" />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 220, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: '#1E293B', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#94A3B8' }}>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ color: 'white' }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="To Do">To Do</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Review">Review</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: '#1E293B', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#94A3B8' }}>Priority</InputLabel>
          <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)} sx={{ color: 'white' }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ borderRadius: 3, backgroundColor: '#14142b', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <TableContainer sx={{ backgroundColor: '#14142b' }}>
          <Table sx={{ backgroundColor: '#14142b' }}>
            <TableHead>
              <TableRow>
                {['Task', 'Project', ...(isMember ? [] : ['Assigned To']), 'Status', 'Priority', 'Due Date', ''].map((h) => (
                  <TableCell key={h} sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && filteredTasks.map((task) => {
                const style = statusColors[task.status] || statusColors['To Do'];
                const assignee = getUserById(task.assignedTo);
                return (
                  <TableRow key={task.taskId} hover sx={{ backgroundColor: '#14142b' }}>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ color: '#ffffff' }}>{task.title}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      {getProjectName(task.projectId)}
                    </TableCell>
                    {!isMember && (
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                        {assignee ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'rgba(99,102,241,0.3)' }}>{assignee.fullName?.[0]}</Avatar>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{assignee.fullName}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Unassigned</Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <Chip label={task.status} size="small" sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <Chip label={task.priority} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: priorityColors[task.priority] || '#fff', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#14142b' }}>
                      <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTask(task); }}>
                        <MoreVert sx={{ color: 'rgba(255,255,255,0.6)' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && filteredTasks.length === 0 && (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)' }} textAlign="center" py={4}>
            {visibleTasks.length === 0
              ? (isMember ? 'No tasks assigned to you yet.' : 'No tasks yet.')
              : 'No tasks match your search.'}
          </Typography>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => openEditDialog(menuTask)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> {canCreateDelete ? 'Edit' : 'Update Status'}
        </MenuItem>
        {canCreateDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: '#f87171' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
        <DialogContent>
          {!editingTask && (
            <Autocomplete
              fullWidth
              options={projects}
              getOptionLabel={(option) => option.name || ''}
              value={projects.find((p) => p.projectId === form.projectId) || null}
              onChange={(e, newValue) => setForm({ ...form, projectId: newValue ? newValue.projectId : '' })}
              renderInput={(params) => <TextField {...params} label="Project" margin="normal" placeholder="Search projects..." />}
              isOptionEqualToValue={(option, value) => option.projectId === value.projectId}
            />
          )}
          <TextField
            fullWidth label="Task Title" margin="normal" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={!canCreateDelete && !!editingTask}
          />
          <TextField
            fullWidth label="Description" margin="normal" multiline rows={2} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={!canCreateDelete && !!editingTask}
          />
          {canCreateDelete && (
            <Autocomplete
              fullWidth
              options={users}
              getOptionLabel={(option) => `${option.fullName} (${option.role})`}
              value={users.find((u) => u.userId === form.assignedTo) || null}
              onChange={(e, newValue) => setForm({ ...form, assignedTo: newValue ? newValue.userId : '' })}
              renderInput={(params) => <TextField {...params} label="Assign To" margin="normal" placeholder="Search team members..." />}
              isOptionEqualToValue={(option, value) => option.userId === value.userId}
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" disabled={!canCreateDelete}>
            <InputLabel>Priority</InputLabel>
            <Select value={form.priority} label="Priority" onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth label="Due Date" type="date" margin="normal" InputLabelProps={{ shrink: true }}
            value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            disabled={!canCreateDelete && !!editingTask}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}