import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, Chip, Avatar, LinearProgress, Button, IconButton, AvatarGroup,
} from '@mui/material';
import {
  Folder, CheckCircle, AutorenewRounded, WarningAmber, People,
  Add, PersonAdd, Assignment, Description, UploadFile, MoreVert,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getProjects, getTasks, getUsers } from '../services/dataService';

const statusColors = {
  'Active': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'In Progress': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  'To Do': { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' },
  'Review': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Completed': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  'On Hold': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
};
const priorityColors = { 'High': '#f87171', 'Medium': '#fbbf24', 'Low': '#4ade80' };
const DONUT_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EF4444'];

// Small illustrative sparkline — not historical data, just a visual trend
function Sparkline({ color, seed }) {
  const data = [seed * 0.6, seed * 0.8, seed * 0.5, seed * 0.9, seed * 0.7, seed * 1, seed * 0.85].map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StatCard({ icon, iconBg, label, value, change, changeUp, sparkColor, onClick }) {
  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.5, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease',
        '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(99,102,241,0.15)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>{label}</Typography>
      </Box>
      <Typography variant="h4" fontWeight="700" sx={{ color: '#ffffff', mb: 0.5 }}>{value}</Typography>
      <Typography variant="caption" sx={{ color: changeUp ? '#4ade80' : '#f87171' }}>
        {changeUp ? '↑' : '↓'} {change} from last month
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Sparkline color={sparkColor} seed={typeof value === 'number' ? value + 5 : 10} />
      </Box>
    </Paper>
  );
}

function QuickAction({ icon, label, onClick, bg }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: '1 1 100px', minWidth: 90, py: 2, borderRadius: '14px', textAlign: 'center', cursor: 'pointer',
        backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.15s',
        '&:hover': { backgroundColor: 'rgba(99,102,241,0.1)', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
        {icon}
      </Box>
      <Typography variant="caption" fontWeight="600" sx={{ color: '#ffffff' }}>{label}</Typography>
    </Box>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, tasksRes, usersRes] = await Promise.all([getProjects(), getTasks(), getUsers()]);
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalProjects = projects.length;
  const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;
  const teamMembers = users.length;
  const toDo = tasks.filter(t => t.status === 'To Do').length;

  const donutData = [
    { name: 'Completed', value: tasksCompleted },
    { name: 'In Progress', value: inProgress },
    { name: 'On Hold', value: toDo },
    { name: 'Overdue', value: overdue },
  ];
  const donutTotal = donutData.reduce((sum, d) => sum + d.value, 0) || 1;
  const completionPct = Math.round((tasksCompleted / donutTotal) * 100);

  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = weekLabels.map((day, i) => {
    const count = tasks.filter(t => {
      if (!t.createdAt) return false;
      const dayIndex = (new Date(t.createdAt).getDay() + 6) % 7;
      return dayIndex === i;
    }).length;
    return { day, tasks: count };
  });

  const upcomingDeadlines = tasks
    .filter(t => t.dueDate && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  const getManagerName = (createdBy) => users.find(u => u.userId === createdBy)?.fullName || 'Unassigned';
  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.status === 'Completed').length;
    return Math.round((done / projectTasks.length) * 100);
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Illustrative only — no activity-log backend yet
  const recentActivity = [
    { text: `${user?.fullName} created project`, target: projects[0]?.name || 'a project', time: '2 mins ago' },
    { text: 'Task status updated', target: tasks[0]?.title || 'a task', time: '15 mins ago' },
    { text: 'New file uploaded', target: 'Project Report.pdf', time: '1 hour ago' },
    { text: 'Task marked complete', target: tasks[1]?.title || 'a task', time: '2 hours ago' },
  ];

  if (loading) {
    return <Typography sx={{ color: '#ffffff' }}>Loading dashboard...</Typography>;
  }

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Welcome back! Here's what's happening in your workspace today.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff' }}>{formattedTime}</Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{formattedDate} • 22°C Sunny, Nairobi</Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<Folder sx={{ color: '#818cf8' }} />} iconBg="rgba(99,102,241,0.15)" label="Total Projects" value={totalProjects} change="12%" changeUp sparkColor="#6366F1" onClick={() => navigate('/projects')} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<CheckCircle sx={{ color: '#4ade80' }} />} iconBg="rgba(34,197,94,0.15)" label="Tasks Completed" value={tasksCompleted} change="18%" changeUp sparkColor="#22C55E" onClick={() => navigate('/tasks')} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<AutorenewRounded sx={{ color: '#fbbf24' }} />} iconBg="rgba(245,158,11,0.15)" label="In Progress" value={inProgress} change="8%" changeUp sparkColor="#F59E0B" onClick={() => navigate('/tasks')} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<WarningAmber sx={{ color: '#f87171' }} />} iconBg="rgba(239,68,68,0.15)" label="Overdue Tasks" value={overdue} change="5%" changeUp={false} sparkColor="#EF4444" onClick={() => navigate('/tasks')} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<People sx={{ color: '#60a5fa' }} />} iconBg="rgba(59,130,246,0.15)" label="Team Members" value={teamMembers} change="15%" changeUp sparkColor="#3B82F6" onClick={() => navigate('/team')} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Project Overview</Typography>
            <Box sx={{ position: 'relative', height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={62} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {donutData.map((entry, index) => <Cell key={index} fill={DONUT_COLORS[index]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="700" sx={{ color: '#ffffff' }}>{completionPct}%</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Overall Progress</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              {[
                ['Total Projects', totalProjects, '#fff'],
                ['Completed', `${tasksCompleted} (${donutTotal ? Math.round(tasksCompleted / donutTotal * 100) : 0}%)`, '#4ade80'],
                ['In Progress', `${inProgress} (${donutTotal ? Math.round(inProgress / donutTotal * 100) : 0}%)`, '#60a5fa'],
                ['On Hold', `${toDo} (${donutTotal ? Math.round(toDo / donutTotal * 100) : 0}%)`, '#fbbf24'],
                ['Overdue', `${overdue} (${donutTotal ? Math.round(overdue / donutTotal * 100) : 0}%)`, '#f87171'],
              ].map(([label, val, color]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>{label}</Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ color }}>{val}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Tasks Progress (This Week)</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <defs>
                  <linearGradient id="purpleLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="tasks" stroke="url(#purpleLine)" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>Upcoming Deadlines</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', cursor: 'pointer' }} onClick={() => navigate('/tasks')}>View All</Typography>
            </Box>
            {upcomingDeadlines.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Nothing due soon.</Typography>
            ) : (
              upcomingDeadlines.map((task) => (
                <Box key={task.taskId} sx={{ py: 1.3, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Chip label={task.priority} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: priorityColors[task.priority] || '#fff', fontWeight: 600, height: 20, fontSize: '0.7rem', mb: 0.5 }} />
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff' }}>{task.title}</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>{new Date(task.dueDate).toLocaleDateString()}</Typography>
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>Recent Projects</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', cursor: 'pointer' }} onClick={() => navigate('/projects')}>View All</Typography>
            </Box>
            {projects.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>No projects yet.</Typography>
            ) : (
              projects.slice(0, 5).map((project) => {
                const style = statusColors[project.status] || statusColors['To Do'];
                const progress = getProjectProgress(project.projectId);
                return (
                  <Box key={project.projectId} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', width: 34, height: 34, fontSize: '0.85rem' }}>
                      {getManagerName(project.createdBy)[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff' }}>{project.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>{getManagerName(project.createdBy)}</Typography>
                    </Box>
                    <Box sx={{ width: 100 }}>
                      <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: '#6366F1' } }} />
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>{progress}%</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', width: 90 }}>
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                    </Typography>
                    <Chip label={project.status} size="small" sx={{ backgroundColor: style.bg, color: style.color, fontWeight: 600 }} />
                    <IconButton size="small" onClick={() => navigate('/projects')}>
                      <MoreVert sx={{ color: '#94A3B8', fontSize: 18 }} />
                    </IconButton>
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>Recent Activity</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8' }}>View All</Typography>
            </Box>
            {recentActivity.map((a, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, py: 1.2 }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.8rem' }}>
                  {user?.fullName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    {a.text} <strong>{a.target}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>{a.time}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Team Performance</Typography>
            <Grid container spacing={2}>
              {[
                ['92%', 'Productivity', '#4ade80'],
                [teamMembers, 'Members Online', '#818cf8'],
                [tasks.length, 'Tasks Assigned', '#60a5fa'],
                [tasksCompleted, 'Tasks Completed', '#fbbf24'],
              ].map(([val, label, color]) => (
                <Grid item xs={6} key={label}>
                  <Typography variant="h5" fontWeight="700" sx={{ color }}>{val}</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>{label}</Typography>
                  <Sparkline color={color} seed={20} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Project Status</Typography>
            <Box sx={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {donutData.map((entry, index) => <Cell key={index} fill={DONUT_COLORS[index]} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
            {donutData.map((d, i) => (
              <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: DONUT_COLORS[i] }} />
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  {d.value} {d.name} ({donutTotal ? Math.round(d.value / donutTotal * 100) : 0}%)
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <QuickAction icon={<Add sx={{ color: '#818cf8' }} />} bg="rgba(99,102,241,0.15)" label="New Project" onClick={() => navigate('/projects')} />
              <QuickAction icon={<PersonAdd sx={{ color: '#c084fc' }} />} bg="rgba(139,92,246,0.15)" label="Add Member" onClick={() => navigate('/team')} />
              <QuickAction icon={<Assignment sx={{ color: '#4ade80' }} />} bg="rgba(34,197,94,0.15)" label="Assign Task" onClick={() => navigate('/tasks')} />
              <QuickAction icon={<Description sx={{ color: '#fbbf24' }} />} bg="rgba(245,158,11,0.15)" label="Generate Report" onClick={() => navigate('/reports')} />
              <QuickAction icon={<UploadFile sx={{ color: '#60a5fa' }} />} bg="rgba(59,130,246,0.15)" label="Upload File" onClick={() => navigate('/files')} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}