import { Box, Typography } from '@mui/material';
import { HourglassEmpty } from '@mui/icons-material';

export default function ComingSoon({ title, subtitle, image }) {
  return (
    <Box sx={{ fontFamily: 'Poppins, sans-serif' }}>
      <Box
        sx={{
          height: 140, borderRadius: '16px', mb: 3, p: 4,
          backgroundImage: `linear-gradient(rgba(10,10,25,0.65), rgba(10,10,25,0.85)), url(${image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'flex-end',
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ color: '#ffffff' }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{subtitle}</Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          py: 10, borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <HourglassEmpty sx={{ fontSize: 48, color: '#818cf8', mb: 2 }} />
        <Typography variant="h6" fontWeight="700" sx={{ color: '#ffffff', mb: 1 }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          This feature is on the way. Check back shortly.
        </Typography>
      </Box>
    </Box>
  );
}