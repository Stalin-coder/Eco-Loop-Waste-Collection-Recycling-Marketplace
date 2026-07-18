import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, CreditCard, Truck, Weight, Building2, TrendingUp, CheckCircle, BarChart3, MapPin, Sparkles, Camera } from 'lucide-react';
import { WASTE_LABELS, INDIAN_CITIES } from '@/lib/constants';

export default function AdminAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const [users, pickups, payments, completedPickups, collectors, recyclers] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('pickup_requests').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('pickup_requests').select('actual_weight, status'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'collector'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'recycler'),
      ]);
      const completed = (completedPickups.data || []).filter(p => p.status === 'completed');
      const totalWeight = completed.reduce((s, p) => s + Number(p.actual_weight || 0), 0);
      const totalPickups = completedPickups.data?.length || 0;
      const successRate = totalPickups > 0 ? Math.round((completed.length / totalPickups) * 100) : 0;
      return {
        totalUsers: users.count || 0,
        totalPickups: pickups.count || 0,
        totalPayments: (payments.data || []).reduce((s, p) => s + Number(p.amount), 0),
        totalWaste: totalWeight,
        activeCollectors: collectors.count || 0,
        recyclingCompanies: recyclers.count || 0,
        completedPickups: completed.length,
        successRate,
      };
    },
  });

  // Waste by city
  const { data: cityData } = useQuery({
    queryKey: ['admin-city-data'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('city, actual_weight, status')
        .eq('status', 'completed');
      const byCity: Record<string, { weight: number; count: number }> = {};
      (data || []).forEach(p => {
        const city = p.city || 'Unknown';
        if (!byCity[city]) byCity[city] = { weight: 0, count: 0 };
        byCity[city].weight += Number(p.actual_weight || 0);
        byCity[city].count++;
      });
      return Object.entries(byCity).sort((a, b) => b[1].weight - a[1].weight).slice(0, 8);
    },
  });

  // Top collectors
  const { data: topCollectors } = useQuery({
    queryKey: ['admin-top-collectors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('collector_id, actual_weight')
        .eq('status', 'completed')
        .not('collector_id', 'is', null);
      // Fetch collector names
      const cIds = [...new Set((data || []).map(p => p.collector_id).filter(Boolean))];
      const { data: profiles } = cIds.length > 0
        ? await supabase.from('profiles').select('id, name').in('id', cIds)
        : { data: [] };
      const pMap = new Map((profiles || []).map(p => [p.id, p]));
      const byCollector: Record<string, { name: string; weight: number; count: number }> = {};
      (data || []).forEach((p: any) => {
        const cid = p.collector_id;
        if (!byCollector[cid]) byCollector[cid] = { name: pMap.get(cid)?.name || 'Unknown', weight: 0, count: 0 };
        byCollector[cid].weight += Number(p.actual_weight || 0);
        byCollector[cid].count++;
      });
      return Object.entries(byCollector).sort((a, b) => b[1].weight - a[1].weight).slice(0, 5);
    },
  });

  // Household participation
  const { data: participation } = useQuery({
    queryKey: ['admin-participation'],
    queryFn: async () => {
      const [total, active] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'household'),
        supabase.from('pickup_requests').select('household_id').then(res => {
          const unique = new Set((res.data || []).map(p => p.household_id));
          return unique.size;
        }),
      ]);
      return {
        totalHouseholds: total.count || 0,
        activeHouseholds: active,
        rate: total.count ? Math.round((active / total.count!) * 100) : 0,
      };
    },
  });

  // AI Accuracy monitoring
  const { data: aiStats } = useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('ai_detected_type, ai_estimated_weight, ai_confidence, waste_type, actual_weight, estimated_weight, photo_url, status');
      const all = data || [];
      const withAi = all.filter((p: any) => p.ai_detected_type);
      const withPhoto = all.filter((p: any) => p.photo_url);
      const completed = withAi.filter((p: any) => p.status === 'completed' && p.actual_weight);
      
      const typeMatches = withAi.filter((p: any) => p.ai_detected_type === p.waste_type).length;
      const typeAccuracy = withAi.length > 0 ? Math.round((typeMatches / withAi.length) * 100) : 0;
      
      const weightErrors = completed.map((p: any) => Math.abs(Number(p.ai_estimated_weight) - Number(p.actual_weight)));
      const avgWeightError = weightErrors.length > 0
        ? weightErrors.reduce((s: number, e: number) => s + e, 0) / weightErrors.length
        : 0;
      
      const avgConfidence = withAi.length > 0
        ? withAi.reduce((s: number, p: any) => s + Number(p.ai_confidence || 0), 0) / withAi.length
        : 0;

      return {
        totalPhotos: withPhoto.length,
        totalAiDetections: withAi.length,
        typeAccuracy,
        avgWeightError: avgWeightError.toFixed(1),
        avgConfidence: Math.round(avgConfidence * 100),
      };
    },
  });

  const mainCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, suffix: '' },
    { label: 'Total Pickups', value: stats?.totalPickups || 0, icon: Package, suffix: '' },
    { label: 'Waste Collected', value: `${(stats?.totalWaste || 0).toFixed(1)}`, icon: Weight, suffix: ' kg' },
    { label: 'Total Payments', value: `₹${(stats?.totalPayments || 0).toFixed(0)}`, icon: CreditCard, suffix: '' },
    { label: 'Active Collectors', value: stats?.activeCollectors || 0, icon: Truck, suffix: '' },
    { label: 'Recycling Cos.', value: stats?.recyclingCompanies || 0, icon: Building2, suffix: '' },
    { label: 'Success Rate', value: `${stats?.successRate || 0}`, icon: CheckCircle, suffix: '%' },
    { label: 'Participation', value: `${participation?.rate || 0}`, icon: TrendingUp, suffix: '%' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mainCards.map(card => {
            const Icon = card.icon;
            return (
              <Card key={card.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-xl font-bold">{card.value}{card.suffix}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Waste by City */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Waste Collected by City
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!cityData || cityData.length === 0) ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {cityData.map(([city, data]) => {
                    const maxWeight = cityData[0][1].weight;
                    return (
                      <div key={city} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{city}</span>
                          <span className="text-muted-foreground">{data.weight.toFixed(1)} kg ({data.count} pickups)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(data.weight / maxWeight) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Collectors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Top Collectors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!topCollectors || topCollectors.length === 0) ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topCollectors.map(([id, data], idx) => (
                    <div key={id} className="flex items-center gap-3 p-2 rounded-lg border">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{data.name}</p>
                        <p className="text-xs text-muted-foreground">{data.count} pickups · {data.weight.toFixed(1)} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Household Participation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Household Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{participation?.totalHouseholds || 0}</p>
                <p className="text-xs text-muted-foreground">Total Households</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{participation?.activeHouseholds || 0}</p>
                <p className="text-xs text-muted-foreground">Active (made a pickup)</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{participation?.rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Participation Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Detection Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> AI Waste Detection Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{aiStats?.totalPhotos || 0}</p>
                <p className="text-xs text-muted-foreground">Photos Uploaded</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{aiStats?.totalAiDetections || 0}</p>
                <p className="text-xs text-muted-foreground">AI Detections</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{aiStats?.typeAccuracy || 0}%</p>
                <p className="text-xs text-muted-foreground">Type Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{aiStats?.avgWeightError || '0.0'} kg</p>
                <p className="text-xs text-muted-foreground">Avg Weight Error</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{aiStats?.avgConfidence || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
