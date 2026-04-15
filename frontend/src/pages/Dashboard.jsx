import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard';
import OrganizerDashboard from './OrganizerDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/auth" />;
  
  return user.role === 'student' ? <StudentDashboard /> : <OrganizerDashboard />;
}
