import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getTasks } from '../services/dataService';

const priorityColors = { 'High': '#f87171', 'Medium': '#fbbf24', 'Low': '#4ade80' };

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await getTasks();
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getTasksForDay = (day) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Calendar</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Task deadlines at a glance</Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => setViewDate(new Date(year, month - 1, 1))}>
            <ChevronLeft sx={{ color: '#94A3B8' }} />
          </IconButton>
          <Typography variant="h6" fontWeight="600" sx={{ color: '#ffffff' }}>{monthLabel}</Typography>
          <IconButton onClick={() => setViewDate(new Date(year, month + 1, 1))}>
            <ChevronRight sx={{ color: '#94A3B8' }} />
          </IconButton>
        </Box>

        <Grid container spacing={1} mb={1}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <Grid item xs={12 / 7} key={d}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', textAlign: 'center' }}>{d}</Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1}>
          {cells.map((day, i) => {
            const dayTasks = day ? getTasksForDay(day) : [];
            return (
              <Grid item xs={12 / 7} key={i}>
                <Box
                  sx={{
                    minHeight: 90, borderRadius: 2, p: 1,
                    backgroundColor: day ? (isToday(day) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)') : 'transparent',
                    border: isToday(day) ? '1px solid #6366F1' : '1px solid transparent',
                  }}
                >
                  {day && (
                    <>
                      <Typography variant="caption" sx={{ color: isToday(day) ? '#818cf8' : '#94A3B8', fontWeight: 600 }}>{day}</Typography>
                      {dayTasks.slice(0, 2).map((t) => (
                        <Chip
                          key={t.taskId}
                          label={t.title}
                          size="small"
                          sx={{
                            display: 'block', mt: 0.5, height: 18, fontSize: '0.62rem',
                            backgroundColor: 'rgba(255,255,255,0.06)', color: priorityColors[t.priority] || '#fff',
                            '& .MuiChip-label': { px: 0.7 },
                          }}
                        />
                      ))}
                      {dayTasks.length > 2 && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>+{dayTasks.length - 2} more</Typography>
                      )}
                    </>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}