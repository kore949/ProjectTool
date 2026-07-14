import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getProjects, getTasks } from '../services/dataService';

const STATUS_COLORS = { 'To Do': '#94A3B8', 'In Progress': '#3B82F6', 'Review': '#F59E0B', 'Completed': '#22C55E' };
const PRIORITY_COLORS = { 'High': '#EF4444', 'Medium': '#F59E0B', 'Low': '#22C55E' };

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const statusCounts = ['To Do', 'In Progress', 'Review', 'Completed'].map(status => ({
    name: status,
    value: tasks.filter(t => t.status === status).length,
  }));

  const priorityCounts = ['High', 'Medium', 'Low'].map(priority => ({
    name: priority,
    value: tasks.filter(t => t.priority === priority).length,
  }));

  const projectProgress = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.projectId);
    const completed = pTasks.filter(t => t.status === 'Completed').length;
    return { name: p.name, progress: pTasks.length ? Math.round((completed / pTasks.length) * 100) : 0 };
  });

  if (loading) return <Typography sx={{ color: '#fff' }}>Loading reports...</Typography>;

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Reports</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Track team productivity and project performance</Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Task Status Distribution</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusCounts} innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={3}>
                  {statusCounts.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Task Priority Breakdown</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={priorityCounts} innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={3}>
                  {priorityCounts.map((entry, i) => <Cell key={i} fill={PRIORITY_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }} mb={2}>Project Completion (%)</Typography>
            {projectProgress.length === 0 ? (
              <Typography sx={{ color: '#94A3B8' }}>No projects yet.</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
                  <Bar dataKey="progress" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}