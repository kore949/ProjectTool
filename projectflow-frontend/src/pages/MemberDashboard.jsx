import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Chip, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Assignment, CheckCircle, AutorenewRounded, WarningAmber, Folder } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getProjects, getTasks } from '../services/dataService';

const priorityColors = { 'High': '#f87171', 'Medium': '#fbbf24', 'Low': '#4ade80' };
const statusColors = {
  'To Do': { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)' },
  'In Progress': { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  'Completed': { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
};
const DONUT_COLORS = ['#4ade80', '#60a5fa', 'rgba(255,255,255,0.2)'];

function StatCard({ icon, iconBg, label, value, change, changeUp }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>{label}</Typography>
      </Box>
      <Typography variant="h4" fontWeight="700" sx={{ color: '#ffffff', mb: 0.5 }}>{value}</Typography>
      {change && (
        <Typography variant="caption" sx={{ color: changeUp ? '#4ade80' : '#f87171' }}>
          {changeUp ? '↑' : '↓'} {change} from last week
        </Typography>
      )}
    </Paper>
  );
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsRes, tasksRes] = await Promise.all([getProjects(), getTasks()]);
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const myTasks = tasks.filter(t => t.assignedTo === user?.userId);
  const myProjectIds = [...new Set(myTasks.map(t => t.projectId))];
  const myProjects = projects.filter(p => myProjectIds.includes(p.projectId));

  const completed = myTasks.filter(t => t.status === 'Completed').length;
  const inProgress = myTasks.filter(t => t.status === 'In Progress').length;
  const toDo = myTasks.filter(t => t.status === 'To Do').length;
  const overdue = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed').length;

  const donutData = [
    { name: 'Completed', value: completed },
    { name: 'In Progress', value: inProgress },
    { name: 'To Do', value: toDo },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;
  const completionPct = Math.round((completed / donutTotal) * 100);

  const upcomingDeadlines = myTasks
    .filter(t => t.dueDate && t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  const getProjectName = (id) => projects.find(p => p.projectId === id)?.name || '-';

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const recentActivity = myTasks.slice(0, 3).map((t, i) => ({
    text: i === 0 ? 'assigned you to task' : i === 1 ? 'you updated task' : 'uploaded a file for',
    target: t.title,
    time: `${(i + 1) * 15} mins ago`,
  }));

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) return <Typography sx={{ color: '#fff' }}>Loading dashboard...</Typography>;

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>
            {getGreeting()}, {user?.fullName?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Here's what's assigned to you today.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff' }}>{formattedTime}</Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{formattedDate} • 22°C Sunny, Nairobi</Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<Assignment sx={{ color: '#818cf8' }} />} iconBg="rgba(99,102,241,0.15)" label="My Tasks" value={myTasks.length} change="10%" changeUp />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<CheckCircle sx={{ color: '#4ade80' }} />} iconBg="rgba(34,197,94,0.15)" label="Completed Tasks" value={completed} change="20%" changeUp />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<AutorenewRounded sx={{ color: '#fbbf24' }} />} iconBg="rgba(245,158,11,0.15)" label="In Progress" value={inProgress} change="5%" changeUp />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<WarningAmber sx={{ color: '#f87171' }} />} iconBg="rgba(239,68,68,0.15)" label="Overdue Tasks" value={overdue} change="10%" changeUp={false} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard icon={<Folder sx={{ color: '#60a5fa' }} />} iconBg="rgba(59,130,246,0.15)" label="Projects" value={myProjects.length} change="8%" changeUp />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>My Tasks</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', cursor: 'pointer' }} onClick={() => navigate('/tasks')}>View All</Typography>
            </Box>
            {myTasks.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>No tasks assigned yet.</Typography>
            ) : myTasks.slice(0, 5).map((t) => (
              <Box key={t.taskId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Chip label={t.priority} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: priorityColors[t.priority] || '#fff', fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff', flexGrow: 1 }}>{t.title}</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Task Progress (This Week)</Typography>
            <Box sx={{ position: 'relative', height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={50} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {donutData.map((entry, index) => <Cell key={index} fill={DONUT_COLORS[index]} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>{completionPct}%</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Tasks Completed</Typography>
              </Box>
            </Box>
            {[['Completed', completed, '#4ade80'], ['In Progress', inProgress, '#60a5fa'], ['To Do', toDo, 'rgba(255,255,255,0.7)']].map(([label, val, color]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>{label}</Typography>
                <Typography variant="caption" fontWeight="600" sx={{ color }}>{val}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>Upcoming Deadlines</Typography>
            </Box>
            {upcomingDeadlines.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Nothing due soon.</Typography>
            ) : upcomingDeadlines.map((t) => (
              <Box key={t.taskId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                <Typography variant="body2" sx={{ color: '#ffffff' }}>{t.title}</Typography>
                <Chip label={t.priority} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', color: priorityColors[t.priority] || '#fff', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>My Projects</Typography>
              <Typography variant="caption" sx={{ color: '#818cf8', cursor: 'pointer' }} onClick={() => navigate('/projects')}>View All</Typography>
            </Box>
            {myProjects.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>Not part of any project yet.</Typography>
            ) : myProjects.map((p) => {
              const pTasks = myTasks.filter(t => t.projectId === p.projectId);
              const progress = pTasks.length ? Math.round((pTasks.filter(t => t.status === 'Completed').length / pTasks.length) * 100) : 0;
              return (
                <Box key={p.projectId} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.3, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff', flexGrow: 1 }}>{p.name}</Typography>
                  <Box sx={{ width: 100 }}>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: '#6366F1' } }} />
                  </Box>
                  <Chip label={p.status} size="small" sx={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }} />
                </Box>
              );
            })}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Recent Activity</Typography>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>No recent activity.</Typography>
            ) : recentActivity.map((a, i) => (
              <Box key={i} sx={{ py: 1 }}>
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {a.text} <strong>{a.target}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>{a.time}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}