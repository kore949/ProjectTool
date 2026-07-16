import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment, Button, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, OutlinedInput, Snackbar, Alert, Divider,
} from '@mui/material';
import { Search, Send, MarkEmailRead, MarkEmailUnread } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getInboxMessages, sendMessage, markMessageRead, getUsers } from '../services/dataService';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Messages() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const canSend = role === 'admin' || role === 'project manager';

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientIds, setRecipientIds] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await getInboxMessages();
      setMessages(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load messages', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
    if (canSend) {
      getUsers().then((res) => setUsers(res.data.filter((u) => u.userId !== user?.userId))).catch(() => {});
    }
  }, []);

  const handleMarkRead = async (msg) => {
    if (msg.isRead) return;
    try {
      await markMessageRead(msg.messageId);
      setMessages((prev) => prev.map((m) => (m.messageId === msg.messageId ? { ...m, isRead: true } : m)));
    } catch (err) {
      // fail silently, not critical
    }
  };

  const handleSend = async () => {
    if (recipientIds.length === 0 || !content.trim()) return;
    setSending(true);
    try {
      await sendMessage(recipientIds, content.trim());
      setSnackbar({ open: true, message: `Message sent to ${recipientIds.length} ${recipientIds.length > 1 ? 'people' : 'person'}`, severity: 'success' });
      setComposeOpen(false);
      setRecipientIds([]);
      setContent('');
      loadInbox();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to send message', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const filtered = messages.filter((m) =>
    m.senderName?.toLowerCase().includes(search.toLowerCase()) ||
    m.content?.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>
            Messages {unreadCount > 0 && <Chip label={`${unreadCount} new`} size="small" sx={{ ml: 1, backgroundColor: '#f87171', color: 'white', fontWeight: 600 }} />}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Direct messages and reminders from your team</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 240, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        {canSend && (
          <Button
            startIcon={<Send />}
            onClick={() => setComposeOpen(true)}
            sx={{
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
              textTransform: 'none', borderRadius: 2, px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
            }}
          >
            New Message
          </Button>
        )}
      </Box>

      {!loading && filtered.length === 0 ? (
        <Paper sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          py: 10, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <MarkEmailRead sx={{ fontSize: 48, color: '#818cf8', mb: 2 }} />
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', mb: 1 }}>
            {messages.length === 0 ? 'No messages yet' : 'No messages match your search'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            {messages.length === 0 ? "You'll see messages from Admins and Project Managers here." : 'Try a different search term.'}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {filtered.map((msg, i) => (
            <Box key={msg.messageId}>
              <Box
                onClick={() => handleMarkRead(msg)}
                sx={{
                  display: 'flex', gap: 2, alignItems: 'flex-start', p: 2.5, cursor: 'pointer',
                  backgroundColor: msg.isRead ? 'transparent' : 'rgba(99,102,241,0.06)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>{msg.senderName?.[0]}</Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#ffffff' }}>{msg.senderName}</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{timeAgo(msg.createdAt)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: msg.isRead ? '#94A3B8' : 'rgba(255,255,255,0.9)' }}>
                    {msg.content}
                  </Typography>
                </Box>
                {!msg.isRead && (
                  <MarkEmailUnread sx={{ color: '#818cf8', fontSize: 18, mt: 0.5 }} />
                )}
              </Box>
              {i < filtered.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />}
            </Box>
          ))}
        </Paper>
      )}

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Recipients</InputLabel>
            <Select
              multiple
              value={recipientIds}
              onChange={(e) => setRecipientIds(e.target.value)}
              input={<OutlinedInput label="Recipients" />}
              renderValue={(selected) => selected.map((id) => users.find((u) => u.userId === id)?.fullName).join(', ')}
            >
              {users.map((u) => (
                <MenuItem key={u.userId} value={u.userId}>{u.fullName} ({u.role})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            margin="normal"
            placeholder="e.g. Reminder: your task is due tomorrow"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={sending || recipientIds.length === 0 || !content.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}