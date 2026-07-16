import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, InputBase, IconButton, Avatar, Badge, Menu, MenuItem
} from '@mui/material';
import {
  Dashboard, Folder, CheckBox, CalendarMonth, People, BarChart,
  Mail, InsertDriveFile, Settings, Search, Notifications, KeyboardArrowDown, Logout
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getUnreadMessageCount } from '../services/dataService';

const drawerWidth = 240;

const baseNavItems = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Projects', icon: <Folder />, path: '/projects' },
  { label: 'Tasks', icon: <CheckBox />, path: '/tasks' },
  { label: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { label: 'Team', icon: <People />, path: '/team' },
  { label: 'Reports', icon: <BarChart />, path: '/reports' },
  { label: 'Messages', icon: <Mail />, path: '/messages' },
  { label: 'Documents', icon: <InsertDriveFile />, path: '/documents' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
const navItems = role === 'admin'
  ? [...baseNavItems.slice(0, 1), { label: 'Users', icon: <People />, path: '/users' }, ...baseNavItems.slice(1)]
  : baseNavItems;
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadUnread = () => {
      getUnreadMessageCount()
        .then((res) => { if (!cancelled) setUnreadCount(res.data?.count ?? 0); })
        .catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [location.pathname]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f23' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#14142b',
            color: 'white',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          },
        }}
      >
        <Toolbar sx={{ py: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Project<span style={{ color: '#a78bfa' }}>Flow</span>
          </Typography>
        </Toolbar>
        <List sx={{ px: 1 }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.label}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: active ? 'rgba(124,58,237,0.25)' : 'transparent',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.75)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.label === 'Messages' && unreadCount > 0 ? (
                    <Badge badgeContent={unreadCount} color="error">{item.icon}</Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#7c3aed' }}>{user?.fullName?.[0] || 'U'}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight="bold">{user?.fullName}</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">{user?.role}</Typography>
            </Box>
            <KeyboardArrowDown sx={{ color: 'rgba(255,255,255,0.5)' }} />
          </Box>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ backgroundColor: '#0f0f23', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold" color="white">Dashboard</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 2, px: 1.5, py: 0.5, width: 260,
              }}>
                <Search sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} fontSize="small" />
                <InputBase placeholder="Search projects, tasks..." sx={{ color: 'white', fontSize: '0.9rem', width: '100%' }} />
              </Box>
              <IconButton onClick={() => navigate('/messages')}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </Badge>
              </IconButton>
              <Avatar src={user?.profilePhoto} sx={{ width: 36, height: 36, bgcolor: '#7c3aed' }}>
  {!user?.profilePhoto && (user?.fullName?.[0] || 'U')}
</Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 } }}>
  <Outlet />
</Box>
      </Box>
    </Box>
  );
}