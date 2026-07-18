import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import { WASTE_LABELS, WASTE_PRICES } from '@/lib/constants';

export default function Earnings() {
  const { profile } = useAuth();

  const { data: completedJobs } = useQuery({
    queryKey: ['earnings-jobs', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('collector_id', profile!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: payments } = useQuery({
    queryKey: ['earnings-payments', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalEarnings = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const todayEarnings = (payments || []).filter(p => new Date(p.created_at) >= todayStart).reduce((s, p) => s + Number(p.amount), 0);
  const weeklyEarnings = (payments || []).filter(p => new Date(p.created_at) >= weekStart).reduce((s, p) => s + Number(p.amount), 0);
  const monthlyEarnings = (payments || []).filter(p => new Date(p.created_at) >= monthStart).reduce((s, p) => s + Number(p.amount), 0);

  // Waste breakdown
  const wasteBreakdown: Record<string, number> = {};
  (completedJobs || []).forEach(j => {
    const wt = j.waste_type;
    const weight = Number(j.actual_weight || j.estimated_weight || 0);
    wasteBreakdown[wt] = (wasteBreakdown[wt] || 0) + weight;
  });
  const totalWasteCollected = Object.values(wasteBreakdown).reduce((s, w) => s + w, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Earnings 💰</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">₹{todayEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">₹{weeklyEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">₹{monthlyEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{totalEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Waste Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waste Collection Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(wasteBreakdown).length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(wasteBreakdown).map(([type, weight]) => {
                  const price = WASTE_PRICES[type] || 0;
                  return (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{WASTE_LABELS[type] || type}</Badge>
                        <span className="text-sm text-muted-foreground">{weight.toFixed(1)} kg × ₹{price}/kg</span>
                      </div>
                      <span className="font-semibold text-primary">₹{(weight * price).toFixed(0)}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div>
                    <span className="font-semibold">Total</span>
                    <span className="text-sm text-muted-foreground ml-2">{totalWasteCollected.toFixed(1)} kg collected</span>
                  </div>
                  <span className="font-bold text-primary text-lg">
                    ₹{Object.entries(wasteBreakdown).reduce((s, [t, w]) => s + w * (WASTE_PRICES[t] || 0), 0).toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Jobs */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Completed Jobs</CardTitle></CardHeader>
          <CardContent>
            {(!completedJobs || completedJobs.length === 0) ? (
              <p className="text-muted-foreground text-sm">No completed jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {completedJobs.map(j => (
                  <div key={j.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">
                        <Badge variant="outline" className="mr-2 capitalize">{j.waste_type}</Badge>
                        {j.actual_weight || j.estimated_weight} kg
                      </p>
                      <p className="text-xs text-muted-foreground">{j.pickup_address} · {new Date(j.updated_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold text-primary">₹{Number(j.payment_amount || 0).toFixed(0)}</span>
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
