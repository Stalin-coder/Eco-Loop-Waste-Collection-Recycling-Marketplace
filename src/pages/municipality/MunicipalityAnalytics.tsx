import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingDown, BarChart3, Recycle } from 'lucide-react';
import { WASTE_LABELS } from '@/lib/constants';

export default function MunicipalityAnalytics() {
  const { profile } = useAuth();
  const city = profile?.city;

  // Recycling demand from orders
  const { data: demandData } = useQuery({
    queryKey: ['municipality-demand', city],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('quantity, inventory_id, status');
      const { data: inventory } = await supabase
        .from('waste_inventory')
        .select('id, waste_type, quantity');
      const invMap = new Map((inventory || []).map(i => [i.id, i]));
      const demand: Record<string, { ordered: number; available: number }> = {};
      (inventory || []).forEach(i => {
        if (!demand[i.waste_type]) demand[i.waste_type] = { ordered: 0, available: 0 };
        demand[i.waste_type].available += Number(i.quantity);
      });
      (orders || []).forEach(o => {
        const inv = invMap.get(o.inventory_id);
        if (inv) {
          if (!demand[inv.waste_type]) demand[inv.waste_type] = { ordered: 0, available: 0 };
          demand[inv.waste_type].ordered += Number(o.quantity);
        }
      });
      return Object.entries(demand).sort((a, b) => b[1].ordered - a[1].ordered);
    },
  });

  // Monthly trends
  const { data: monthlyData } = useQuery({
    queryKey: ['municipality-monthly', city],
    queryFn: async () => {
      const base = city
        ? supabase.from('pickup_requests').select('created_at, actual_weight, status').eq('city', city)
        : supabase.from('pickup_requests').select('created_at, actual_weight, status');
      const { data } = await base;
      const byMonth: Record<string, { total: number; completed: number; weight: number }> = {};
      (data || []).forEach(p => {
        const month = new Date(p.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
        if (!byMonth[month]) byMonth[month] = { total: 0, completed: 0, weight: 0 };
        byMonth[month].total++;
        if (p.status === 'completed') {
          byMonth[month].completed++;
          byMonth[month].weight += Number(p.actual_weight || 0);
        }
      });
      return Object.entries(byMonth).slice(-6);
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">City Analytics</h1>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Monthly Pickup Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!monthlyData || monthlyData.length === 0) ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {monthlyData.map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{month}</span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{data.total} pickups</span>
                      <span>{data.completed} completed</span>
                      <span className="font-medium text-foreground">{data.weight.toFixed(1)} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recycling Demand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Recycle className="w-5 h-5 text-primary" /> Recycling Demand vs Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!demandData || demandData.length === 0) ? (
              <p className="text-sm text-muted-foreground">No marketplace data yet.</p>
            ) : (
              <div className="space-y-3">
                {demandData.map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium capitalize">{(WASTE_LABELS as any)[type] || type}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">Available: {data.available.toFixed(0)} kg</span>
                      <span className="text-primary font-medium">Ordered: {data.ordered.toFixed(0)} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
