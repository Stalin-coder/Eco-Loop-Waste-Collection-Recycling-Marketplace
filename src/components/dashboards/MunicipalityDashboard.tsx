import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, Weight, CheckCircle, TrendingUp, MapPin, Recycle, Users } from 'lucide-react';
import { WASTE_LABELS } from '@/lib/constants';

export default function MunicipalityDashboard() {
  const { profile } = useAuth();
  const city = profile?.city;

  const { data: stats } = useQuery({
    queryKey: ['municipality-stats', city],
    queryFn: async () => {
      const base = city
        ? supabase.from('pickup_requests').select('actual_weight, status, waste_type, area, collector_id, city').eq('city', city)
        : supabase.from('pickup_requests').select('actual_weight, status, waste_type, area, collector_id, city');
      const { data: pickups } = await base;
      const all = pickups || [];
      const completed = all.filter(p => p.status === 'completed');
      const totalWeight = completed.reduce((s, p) => s + Number(p.actual_weight || 0), 0);
      const successRate = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;

      // Recyclable vs total
      const recyclableTypes = ['plastic', 'paper', 'cardboard', 'metal', 'glass'];
      const recyclableWeight = completed
        .filter(p => recyclableTypes.includes(p.waste_type))
        .reduce((s, p) => s + Number(p.actual_weight || 0), 0);
      const recyclablePercent = totalWeight > 0 ? Math.round((recyclableWeight / totalWeight) * 100) : 0;

      // Active collectors
      const activeCollectors = new Set(all.filter(p => p.collector_id).map(p => p.collector_id)).size;

      // By area
      const byArea: Record<string, { weight: number; count: number }> = {};
      completed.forEach(p => {
        const area = p.area || 'Unknown';
        if (!byArea[area]) byArea[area] = { weight: 0, count: 0 };
        byArea[area].weight += Number(p.actual_weight || 0);
        byArea[area].count++;
      });

      // By waste type
      const byType: Record<string, number> = {};
      completed.forEach(p => {
        byType[p.waste_type] = (byType[p.waste_type] || 0) + Number(p.actual_weight || 0);
      });

      return {
        totalPickups: all.length,
        completedPickups: completed.length,
        totalWeight,
        recyclablePercent,
        successRate,
        activeCollectors,
        byArea: Object.entries(byArea).sort((a, b) => b[1].weight - a[1].weight),
        byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
      };
    },
  });

  // Top collectors in city
  const { data: topCollectors } = useQuery({
    queryKey: ['municipality-top-collectors', city],
    queryFn: async () => {
      const base = city
        ? supabase.from('pickup_requests').select('collector_id, actual_weight').eq('status', 'completed').eq('city', city).not('collector_id', 'is', null)
        : supabase.from('pickup_requests').select('collector_id, actual_weight').eq('status', 'completed').not('collector_id', 'is', null);
      const { data } = await base;
      const cIds = [...new Set((data || []).map(p => p.collector_id).filter(Boolean))];
      const { data: profiles } = cIds.length > 0
        ? await supabase.from('profiles').select('id, name').in('id', cIds)
        : { data: [] };
      const pMap = new Map((profiles || []).map(p => [p.id, p]));
      const byC: Record<string, { name: string; weight: number; count: number }> = {};
      (data || []).forEach((p: any) => {
        if (!byC[p.collector_id]) byC[p.collector_id] = { name: pMap.get(p.collector_id)?.name || 'Unknown', weight: 0, count: 0 };
        byC[p.collector_id].weight += Number(p.actual_weight || 0);
        byC[p.collector_id].count++;
      });
      return Object.entries(byC).sort((a, b) => b[1].weight - a[1].weight).slice(0, 5);
    },
  });

  // Low participation areas
  const { data: householdStats } = useQuery({
    queryKey: ['municipality-household-participation', city],
    queryFn: async () => {
      const base = city
        ? supabase.from('profiles').select('id, area').eq('role', 'household').eq('city', city)
        : supabase.from('profiles').select('id, area').eq('role', 'household');
      const { data: households } = await base;
      
      const pickupBase = city
        ? supabase.from('pickup_requests').select('household_id').eq('city', city)
        : supabase.from('pickup_requests').select('household_id');
      const { data: pickups } = await pickupBase;
      const activeIds = new Set((pickups || []).map(p => p.household_id));

      const byArea: Record<string, { total: number; active: number }> = {};
      (households || []).forEach(h => {
        const area = h.area || 'Unknown';
        if (!byArea[area]) byArea[area] = { total: 0, active: 0 };
        byArea[area].total++;
        if (activeIds.has(h.id)) byArea[area].active++;
      });

      return Object.entries(byArea)
        .map(([area, d]) => ({ area, ...d, rate: d.total > 0 ? Math.round((d.active / d.total) * 100) : 0 }))
        .sort((a, b) => a.rate - b.rate);
    },
  });

  const mainCards = [
    { label: 'Total Pickups', value: stats?.totalPickups || 0, icon: Package, suffix: '' },
    { label: 'Waste Collected', value: `${(stats?.totalWeight || 0).toFixed(1)}`, icon: Weight, suffix: ' kg' },
    { label: 'Recyclable %', value: `${stats?.recyclablePercent || 0}`, icon: Recycle, suffix: '%' },
    { label: 'Success Rate', value: `${stats?.successRate || 0}`, icon: CheckCircle, suffix: '%' },
    { label: 'Active Collectors', value: stats?.activeCollectors || 0, icon: Truck, suffix: '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Municipality Dashboard 🏛️</h1>
        <p className="text-muted-foreground">
          City waste management overview{city ? ` — ${city}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
        {/* Waste by Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Waste Collection by Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!stats?.byArea || stats.byArea.length === 0) ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.byArea.slice(0, 8).map(([area, data]) => {
                  const maxW = stats.byArea[0][1].weight;
                  return (
                    <div key={area} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{area}</span>
                        <span className="text-muted-foreground">{data.weight.toFixed(1)} kg ({data.count} pickups)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(data.weight / maxW) * 100}%` }} />
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

        {/* Waste by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Recycle className="w-5 h-5 text-primary" /> Waste by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!stats?.byType || stats.byType.length === 0) ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.byType.map(([type, weight]) => {
                  const maxW = stats.byType[0][1];
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{(WASTE_LABELS as any)[type] || type}</span>
                        <span className="text-muted-foreground">{weight.toFixed(1)} kg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${(weight / maxW) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Participation Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Area Participation Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!householdStats || householdStats.length === 0) ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {householdStats.slice(0, 8).map(item => (
                  <div key={item.area} className="flex items-center justify-between p-2 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{item.area}</p>
                      <p className="text-xs text-muted-foreground">{item.active}/{item.total} households active</p>
                    </div>
                    <span className={`text-sm font-bold ${item.rate < 30 ? 'text-destructive' : item.rate < 60 ? 'text-secondary-foreground' : 'text-primary'}`}>
                      {item.rate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
