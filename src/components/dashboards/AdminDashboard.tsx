import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, CreditCard, Recycle, Truck, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, pickups, payments, collectors] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('pickup_requests').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'collector'),
      ]);
      const totalPayments = (payments.data || []).reduce((s, p) => s + Number(p.amount), 0);
      return {
        totalUsers: users.count || 0,
        totalPickups: pickups.count || 0,
        totalPayments,
        activeCollectors: collectors.count || 0,
      };
    },
  });

  const { data: recentPickups } = useQuery({
    queryKey: ['admin-recent-pickups'],
    queryFn: async () => {
      const { data: pickupData } = await supabase
        .from('pickup_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!pickupData || pickupData.length === 0) return [];
      const hIds = [...new Set(pickupData.map(p => p.household_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name, city').in('id', hIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p]));
      return pickupData.map(p => ({ ...p, profiles: pMap.get(p.household_id) || null }));
    },
  }) as { data: any[] | undefined };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard 🛡️</h1>
        <p className="text-muted-foreground">Monitor the entire EcoLoop ecosystem</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Collectors</p>
                <p className="text-2xl font-bold">{stats?.activeCollectors || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pickups</p>
                <p className="text-2xl font-bold">{stats?.totalPickups || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">₹{stats?.totalPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Pickup Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {(!recentPickups || recentPickups.length === 0) ? (
            <p className="text-muted-foreground text-sm">No pickups yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPickups.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{p.profiles?.name || 'Unknown'} · {p.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{p.estimated_weight} kg · {p.profiles?.city || p.city}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-muted text-muted-foreground capitalize">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
