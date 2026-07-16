import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, IconButton,
  Chip, Snackbar, Alert, Tooltip, Menu, MenuItem, LinearProgress,
} from '@mui/material';
import {
  Search, UploadFile, Download, Delete, PictureAsPdf, Image as ImageIcon,
  Description, TableChart, Slideshow, InsertDriveFile, MoreVert,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getDocuments, uploadDocument, downloadDocument, deleteDocument } from '../services/dataService';

const iconForType = (type, name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (type?.includes('pdf') || ext === 'pdf') return <PictureAsPdf sx={{ color: '#f87171' }} />;
  if (type?.includes('image')) return <ImageIcon sx={{ color: '#60a5fa' }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <TableChart sx={{ color: '#4ade80' }} />;
  if (['ppt', 'pptx'].includes(ext)) return <Slideshow sx={{ color: '#fbbf24' }} />;
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return <Description sx={{ color: '#818cf8' }} />;
  return <InsertDriveFile sx={{ color: '#94A3B8' }} />;
};

const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Documents() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();
  const canUpload = role === 'admin' || role === 'project manager';
  const fileInputRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuDoc, setMenuDoc] = useState(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await getDocuments();
      setDocs(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load documents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      for (const file of files) {
        await uploadDocument(file, null, (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        });
      }
      setSnackbar({ open: true, message: `${files.length} file${files.length > 1 ? 's' : ''} uploaded`, severity: 'success' });
      loadDocs();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Upload failed', severity: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await downloadDocument(doc.documentId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setSnackbar({ open: true, message: 'Download failed', severity: 'error' });
    }
  };

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.documentId);
      setSnackbar({ open: true, message: `${doc.fileName} removed`, severity: 'success' });
      setMenuAnchor(null);
      loadDocs();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to remove file', severity: 'error' });
    }
  };

  const filtered = docs.filter((d) => d.fileName.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: 'linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>Documents</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>Shared project files — visible to everyone on the team</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: uploading ? 1 : 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 240, backgroundColor: '#1E293B', borderRadius: 2, input: { color: 'white' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
        {canUpload && (
          <Button
            startIcon={<UploadFile />}
            onClick={handleUploadClick}
            disabled={uploading}
            sx={{
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', color: 'white',
              textTransform: 'none', borderRadius: 2, px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        )}
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilesSelected} />
      </Box>

      {uploading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: '#6366F1' } }} />
        </Box>
      )}

      {!loading && filtered.length === 0 ? (
        <Paper sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          py: 10, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <UploadFile sx={{ fontSize: 48, color: '#818cf8', mb: 2 }} />
          <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', mb: 1 }}>
            {docs.length === 0 ? 'No documents yet' : 'No documents match your search'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
            {docs.length === 0
              ? (canUpload ? 'Upload your first file to share it with the team.' : 'Nothing has been shared with you yet.')
              : 'Try a different search term.'}
          </Typography>
          {docs.length === 0 && canUpload && (
            <Button
              startIcon={<UploadFile />}
              onClick={handleUploadClick}
              variant="outlined"
              sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
            >
              Upload File
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((doc) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.documentId}>
              <Paper sx={{
                p: 2.5, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(99,102,241,0.15)' },
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {iconForType(doc.contentType, doc.fileName)}
                  </Box>
                  <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuDoc(doc); }}>
                    <MoreVert sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </IconButton>
                </Box>
                <Tooltip title={doc.fileName}>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#ffffff', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.fileName}
                  </Typography>
                </Tooltip>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>
                  {formatSize(doc.fileSizeBytes)} • {new Date(doc.createdAt).toLocaleDateString()}
                </Typography>
                <Chip label={doc.uploadedByName} size="small" sx={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { handleDownload(menuDoc); setMenuAnchor(null); }}>
          <Download fontSize="small" sx={{ mr: 1 }} /> Download
        </MenuItem>
        {canUpload && (
          <MenuItem onClick={() => handleDelete(menuDoc)} sx={{ color: '#f87171' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
      </Menu>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}