import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import HouseholdDashboard from '@/components/dashboards/HouseholdDashboard';
import CollectorDashboard from '@/components/dashboards/CollectorDashboard';
import RecyclerDashboard from '@/components/dashboards/RecyclerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import MunicipalityDashboard from '@/components/dashboards/MunicipalityDashboard';

export default function Dashboard() {
  const { profile } = useAuth();
  const role = profile?.role || 'household';

  const dashboards: Record<string, JSX.Element> = {
    household: <HouseholdDashboard />,
    collector: <CollectorDashboard />,
    recycler: <RecyclerDashboard />,
    admin: <AdminDashboard />,
    municipality: <MunicipalityDashboard />,
  };

  return (
    <DashboardLayout>
      {dashboards[role] || <HouseholdDashboard />}
    </DashboardLayout>
  );
}
