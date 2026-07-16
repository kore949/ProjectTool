import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, AvatarGroup, Chip, TextField, InputAdornment,
  Button, IconButton, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress, Snackbar, Alert, Tooltip, Menu,
} from '@mui/material';
import {
  Search, Add, Edit, Delete, MoreVert, PersonAdd, PersonRemove, Groups, CheckCircle, Assignment,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  getProjects, getTasks, getUsers, createProject, updateProject, deleteProject,
  getAllProjectMembers, addProjectMember, removeProjectMember,
} from '../services/dataService';

const roleColors = {
  'Admin': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  'Project Manager': { bg: 'rgba(139,92,246,0.15)', color: '#c084fc' },
  'Team Member': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

// Team display name and manager pick aren't backed by dedicated columns yet,
// so those two small pieces stay local for now. Membership itself (who's on
// the team) now comes from the real ProjectMembers table via the API.
const loadLocal = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
};
const saveLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export default function Team() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const isAdmin = role === 'admin';
  const isPM = role === 'project manager';

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]); // real ProjectMembers rows from the API
  const [loading, setLoading] = useState(true);

  const [teamNames, setTeamNames] = useState(() => loadLocal('projectflow_team_names'));
  const [teamManagers, setTeamManagers] = useState(() => loadLocal('projectflow_team_managers'));

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form, setForm] = useState({ teamName: '', description: '', startDate: '', endDate: '', managerId: '' });

  const [membersDialogProjectId, setMembersDialogProjectId] = useState(null);
  const [addMemberId, setAddMemberId] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTeam, setMenuTeam] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, usersRes, membersRes] = await Promise.all([
        getProjects(), getTasks(), getUsers(), getAllProjectMembers(),
      ]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load teams', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const persistLocal = (key, setter, updater) => {
    setter((prev) => {
      const next = updater(prev);
      saveLocal(key, next);
      return next;
    });
  };

  const teams = useMemo(() => projects.map((project) => {
    const pTasks = tasks.filter((t) => t.projectId === project.projectId);
    const completed = pTasks.filter((t) => t.status === 'Completed').length;
    const progress = pTasks.length ? Math.round((completed / pTasks.length) * 100) : 0;

    const managerId = teamManagers[project.projectId] ?? project.createdBy;
    const manager = users.find((u) => u.userId === managerId);

    const projectMembers = members.filter((m) => m.projectId === project.projectId);
    const memberIds = projectMembers.map((m) => m.userId);
    const memberUsers = memberIds.map((id) => users.find((u) => u.userId === id)).filter(Boolean);

    const teamName = teamNames[project.projectId] || `${project.name} Team`;
    const status = project.status === 'Completed' ? 'Completed' : 'Active';

    return {
      projectId: project.projectId,
      teamName,
      projectName: project.name,
      manager,
      members: memberUsers,
      memberIds,
      taskCount: pTasks.length,
      completed,
      progress,
      status,
      project,
    };
  }), [projects, tasks, users, members, teamNames, teamManagers]);

  const canManageTeam = (team) => isAdmin || (isPM && team.manager?.userId === user?.userId);

  const visibleTeams = useMemo(() => teams.filter((t) => {
    if (isAdmin) return true;
    if (isPM) return t.manager?.userId === user?.userId;
    return t.memberIds.includes(user?.userId);
  }), [teams, isAdmin, isPM, user]);

  const filteredTeams = visibleTeams.filter((t) => {
    const matchesSearch = t.teamName.toLowerCase().includes(search.toLowerCase())
      || t.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: visibleTeams.length,
    active: visibleTeams.filter((t) => t.status === 'Active').length,
    completed: visibleTeams.filter((t) => t.status === 'Completed').length,
    members: new Set(visibleTeams.flatMap((t) => t.memberIds)).size,
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setForm({ teamName: '', description: '', startDate: '', endDate: '', managerId: user?.userId || '' });
    setTeamDialogOpen(true);
  };

  const openEditDialog = (team) => {
    setEditingTeam(team);
    setForm({
      teamName: team.teamName,
      description: team.project.description || '',
      startDate: team.project.startDate?.split('T')[0] || '',
      endDate: team.project.endDate?.split('T')[0] || '',
      managerId: team.manager?.userId || '',
    });
    setTeamDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleSaveTeam = async () => {
    try {
      if (editingTeam) {
        await updateProject(editingTeam.projectId, {
          name: editingTeam.projectName,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          status: editingTeam.project.status,
        });
        persistLocal('projectflow_team_names', setTeamNames, (prev) => ({ ...prev, [editingTeam.projectId]: form.teamName }));
        if (form.managerId) {
          persistLocal('projectflow_team_managers', setTeamManagers, (prev) => ({ ...prev, [editingTeam.projectId]: form.managerId }));
        }
        setSnackbar({ open: true, message: 'Team updated', severity: 'success' });
      } else {
        const res = await createProject({
          name: form.teamName,
          description: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        const newProjectId = res.data?.projectId;
        if (newProjectId) {
          persistLocal('projectflow_team_names', setTeamNames, (prev) => ({ ...prev, [newProjectId]: form.teamName }));
          if (form.managerId) {
            persistLocal('projectflow_team_managers', setTeamManagers, (prev) => ({ ...prev, [newProjectId]: form.managerId }));
          }
        }
        setSnackbar({ open: true, message: 'Team created', severity: 'success' });
      }
   setTeamDialogOpen(false);
      loadAll();
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.title || err.message || 'Unknown error';
      setSnackbar({ open: true, message: `Failed to save team: ${detail}`, severity: 'error' });
      console.error('Team save failed:', err.response?.data || err);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.projectId);
      setSnackbar({ open: true, message: 'Team deleted', severity: 'success' });
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete team', severity: 'error' });
    }
  };

  const handleAddMember = async () => {
    if (!addMemberId || !membersDialogProjectId) return;
    try {
      await addProjectMember(membersDialogProjectId, addMemberId);
      setAddMemberId('');
      loadAll();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add member', severity: 'error' });
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!membersDialogProjectId) return;
    try {
      await removeProjectMember(membersDialogProjectId, userId);
      loadAll();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
    }
  };

  const membersDialogTeam = membersDialogProjectId
    ? teams.find((t) => t.projectId === membersDialogProjectId)
    : null;

  const availableToAdd = membersDialogTeam
    ? users.filter((u) => !membersDialogTeam.memberIds.includes(u.userId))
    : [];

  if (loading) return <Typography sx={{ color: '#fff' }}>Loading teams...</Typography>;

return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Teams</Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>Project teams, members, and progress at a glance</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: '14px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Groups sx={{ color: '#818cf8' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.1 }}>{stats.total}</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Total Teams</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: '14px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle sx={{ color: '#4ade80' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.1 }}>{stats.active}</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Active</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: '14px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Assignment sx={{ color: '#60a5fa' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.1 }}>{stats.completed}</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Completed</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: '14px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonAdd sx={{ color: '#fbbf24' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.1 }}>{stats.members}</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Members</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search teams or projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 240, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 160, backgroundColor: '#1E293B', borderRadius: 2 }}>
          <InputLabel sx={{ color: '#94A3B8' }}>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ color: 'white' }}>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
        </FormControl>
        {isAdmin && (
          <Button
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
              textTransform: 'none', borderRadius: 2, px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
            }}
          >
            Create Team
          </Button>
        )}
      </Box>

      {filteredTeams.length === 0 ? (
        <Paper sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          py: 10, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Groups sx={{ fontSize: 48, color: '#818cf8', mb: 2 }} />
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', mb: 1 }}>
            {visibleTeams.length === 0 ? 'No teams yet' : 'No teams match your search'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            {visibleTeams.length === 0 ? 'Teams are created from projects.' : 'Try a different search or filter.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredTeams.map((team) => (
            <Grid item xs={12} sm={6} md={4} key={team.projectId}>
              <Paper sx={{
                p: 2.5, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(99,102,241,0.15)' },
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="body1" fontWeight="700" sx={{ color: '#ffffff' }}>{team.teamName}</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{team.projectName}</Typography>
                  </Box>
                  {canManageTeam(team) && (
                    <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTeam(team); }}>
                      <MoreVert sx={{ color: '#94A3B8', fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

                <Chip
                  label={team.status}
                  size="small"
                  sx={{
                    mb: 1.5,
                    backgroundColor: team.status === 'Completed' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                    color: team.status === 'Completed' ? '#4ade80' : '#818cf8', fontWeight: 600,
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(139,92,246,0.2)', color: '#c084fc', fontSize: '0.75rem' }}>
                    {team.manager?.fullName?.[0] || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.1 }}>Project Manager</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff' }}>{team.manager?.fullName || 'Unassigned'}</Typography>
                  </Box>
                </Box>

                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                  Team Members ({team.members.length})
                </Typography>
                <AvatarGroup max={5} sx={{ justifyContent: 'flex-start', mb: 1.5, '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.75rem', border: '2px solid #1E293B' } }}>
                  {team.members.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>No members yet</Typography>
                  ) : team.members.map((m) => (
                    <Tooltip key={m.userId} title={`${m.fullName} (${m.role})`}>
                      <Avatar sx={{ bgcolor: (roleColors[m.role] || roleColors['Team Member']).bg, color: (roleColors[m.role] || roleColors['Team Member']).color }}>
                        {m.fullName?.[0]}
                      </Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>{team.taskCount} tasks assigned</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>{team.progress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={team.progress}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', mb: canManageTeam(team) ? 2 : 0, '& .MuiLinearProgress-bar': { backgroundColor: '#6366F1' } }}
                />

                {canManageTeam(team) && (
                  <Button
                    fullWidth
                    startIcon={<PersonAdd fontSize="small" />}
                    onClick={() => setMembersDialogProjectId(team.projectId)}
                    sx={{ textTransform: 'none', borderRadius: 2, color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.1)', '&:hover': { backgroundColor: 'rgba(99,102,241,0.18)' } }}
                  >
                    Manage Members
                  </Button>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => openEditDialog(menuTeam)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit Team
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => { setDeleteTarget(menuTeam); setMenuAnchor(null); }} sx={{ color: '#f87171' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete Team
          </MenuItem>
        )}
      </Menu>

      {/* Create / Edit team dialog */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Team Name" margin="normal" value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
          />
          <TextField
            fullWidth label="Project Description" margin="normal" multiline rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            fullWidth label="Start Date" type="date" margin="normal" InputLabelProps={{ shrink: true }}
            sx={{ input: { color: 'white', colorScheme: 'dark' } }}
            value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <TextField
            fullWidth label="End Date" type="date" margin="normal" InputLabelProps={{ shrink: true }}
            sx={{ input: { color: 'white', colorScheme: 'dark' } }}
            value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          {isAdmin && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Project Manager</InputLabel>
              <Select
                value={form.managerId}
                label="Project Manager"
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
              >
                {users.filter((u) => u.role === 'Project Manager' || u.role === 'Admin').map((u) => (
                  <MenuItem key={u.userId} value={u.userId}>{u.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTeam} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Manage members dialog */}
      <Dialog open={Boolean(membersDialogTeam)} onClose={() => setMembersDialogProjectId(null)} fullWidth maxWidth="xs">
        <DialogTitle>Manage Members — {membersDialogTeam?.teamName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Add member</InputLabel>
              <Select value={addMemberId} label="Add member" onChange={(e) => setAddMemberId(e.target.value)}>
                {availableToAdd.map((u) => (
                  <MenuItem key={u.userId} value={u.userId}>{u.fullName} ({u.role})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleAddMember} disabled={!addMemberId}>Add</Button>
          </Box>

          {membersDialogTeam?.members.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>No members yet.</Typography>
          ) : (
            membersDialogTeam?.members.map((m) => (
              <Box key={m.userId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem' }}>{m.fullName?.[0]}</Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="600">{m.fullName}</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{m.role}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => handleRemoveMember(m.userId)} sx={{ color: '#f87171' }}>
                  <PersonRemove fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogProjectId(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Team</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This deletes <strong>{deleteTarget?.teamName}</strong> and its underlying project. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}