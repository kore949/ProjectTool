import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ProjectManagerDashboard from './ProjectManagerDashboard';
import MemberDashboard from './MemberDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = (user?.role || '').trim().toLowerCase();

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'project manager') return <ProjectManagerDashboard />;
  return <MemberDashboard />;
}