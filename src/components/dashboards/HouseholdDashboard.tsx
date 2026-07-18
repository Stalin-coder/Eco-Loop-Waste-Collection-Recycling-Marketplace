import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Star, CreditCard, Recycle, Lightbulb, TrendingUp, CalendarClock, RefreshCcw, Leaf, TreePine, Droplets, Zap } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, WASTE_LABELS, ECO_POINTS, ENV_IMPACT } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function HouseholdDashboard() {
  const { profile } = useAuth();

  const { data: pickups } = useQuery({
    queryKey: ['household-pickups', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('household_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: allPickups } = useQuery({
    queryKey: ['household-all-pickups', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('waste_type, actual_weight, estimated_weight, created_at, status')
        .eq('household_id', profile!.id)
        .eq('status', 'completed');
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: rewards } = useQuery({
    queryKey: ['household-rewards', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('points')
        .eq('user_id', profile!.id);
      return (data || []).reduce((sum, r) => sum + r.points, 0);
    },
    enabled: !!profile?.id,
  });

  const { data: totalPayments } = useQuery({
    queryKey: ['household-payments', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', profile!.id);
      return (data || []).reduce((sum, p) => sum + Number(p.amount), 0);
    },
    enabled: !!profile?.id,
  });

  const { data: activeSubscriptions } = useQuery({
    queryKey: ['household-subscriptions', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_subscriptions')
        .select('*')
        .eq('household_id', profile!.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const activePickups = (pickups || []).filter(p => p.status !== 'completed').length;

  // Environmental impact calculations
  const completed = allPickups || [];
  const wasteByType: Record<string, number> = {};
  completed.forEach(p => {
    const w = Number(p.actual_weight || p.estimated_weight || 0);
    wasteByType[p.waste_type] = (wasteByType[p.waste_type] || 0) + w;
  });
  const totalRecycled = Object.values(wasteByType).reduce((s, w) => s + w, 0);

  const totalCO2 = Object.entries(wasteByType).reduce(
    (s, [type, kg]) => s + kg * (ENV_IMPACT.co2_per_kg[type as keyof typeof ENV_IMPACT.co2_per_kg] || 0), 0
  );
  const totalTrees = Object.entries(wasteByType).reduce(
    (s, [type, kg]) => s + kg * ((ENV_IMPACT.trees_per_kg as any)[type] || 0), 0
  );
  const totalWater = Object.entries(wasteByType).reduce(
    (s, [type, kg]) => s + kg * (ENV_IMPACT.water_per_kg[type as keyof typeof ENV_IMPACT.water_per_kg] || 0), 0
  );
  const totalEnergy = Object.entries(wasteByType).reduce(
    (s, [type, kg]) => s + kg * (ENV_IMPACT.energy_per_kg[type as keyof typeof ENV_IMPACT.energy_per_kg] || 0), 0
  );

  // Monthly progress
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthPickups = completed.filter(p => new Date(p.created_at) >= monthStart);
  const monthlyRecycled = thisMonthPickups.reduce((s, p) => s + Number(p.actual_weight || p.estimated_weight || 0), 0);

  // Smart pickup recommendation
  const recommendation = (() => {
    if (completed.length < 2) return null;
    const typeCounts: Record<string, { count: number; totalWeight: number }> = {};
    completed.forEach(p => {
      if (!typeCounts[p.waste_type]) typeCounts[p.waste_type] = { count: 0, totalWeight: 0 };
      typeCounts[p.waste_type].count++;
      typeCounts[p.waste_type].totalWeight += Number(p.actual_weight || 0);
    });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1].count - a[1].count)[0];
    if (!topType) return null;
    const avgWeight = (topType[1].totalWeight / topType[1].count).toFixed(1);
    const lastPickup = completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const daysSince = Math.floor((Date.now() - new Date(lastPickup.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return { wasteType: WASTE_LABELS[topType[0]] || topType[0], avgWeight, daysSince, shouldSchedule: daysSince >= 5 };
  })();

  const ecoLevel = rewards ? (rewards >= 1000 ? 'Eco Champion 🏆' : rewards >= 500 ? 'Green Warrior 🌿' : rewards >= 100 ? 'Eco Starter 🌱' : 'Beginner 🌍') : 'Beginner 🌍';
  const nextLevelPoints = rewards ? (rewards >= 1000 ? 2000 : rewards >= 500 ? 1000 : rewards >= 100 ? 500 : 100) : 100;
  const progressPercent = rewards ? Math.min((rewards / nextLevelPoints) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {profile?.name || 'User'} 👋</h1>
        <p className="text-muted-foreground">Manage your recyclable waste pickups</p>
      </div>

      {/* Eco Level Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Star className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Eco Level</p>
              <p className="text-lg font-bold">{ecoLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{rewards || 0}</p>
              <p className="text-xs text-muted-foreground">eco points</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to next level</span>
              <span>{rewards || 0}/{nextLevelPoints} pts</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" /> Your Environmental Impact
          </CardTitle>
          {monthlyRecycled > 0 && (
            <p className="text-sm text-muted-foreground">
              🎉 You helped recycle <span className="font-semibold text-primary">{monthlyRecycled.toFixed(1)}kg</span> of waste this month!
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
              <Recycle className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{totalRecycled.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kg recycled</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-center">
              <Leaf className="w-6 h-6 text-destructive mx-auto mb-1" />
              <p className="text-xl font-bold">{totalCO2.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂ prevented</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/10 text-center">
              <TreePine className="w-6 h-6 text-secondary mx-auto mb-1" />
              <p className="text-xl font-bold">{totalTrees.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">trees saved</p>
            </div>
            <div className="p-3 rounded-xl bg-accent border border-border text-center">
              <Droplets className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{totalWater >= 1000 ? `${(totalWater / 1000).toFixed(1)}k` : totalWater.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">litres water saved</p>
            </div>
          </div>

          {/* Waste breakdown by type */}
          {Object.keys(wasteByType).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recycling Breakdown</p>
              {Object.entries(wasteByType).sort((a, b) => b[1] - a[1]).map(([type, kg]) => {
                const maxKg = Math.max(...Object.values(wasteByType));
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{WASTE_LABELS[type] || type}</span>
                      <span className="font-medium">{kg.toFixed(1)} kg</span>
                    </div>
                    <Progress value={(kg / maxKg) * 100} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}

          {totalRecycled === 0 && (
            <div className="text-center py-4">
              <Recycle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Complete your first pickup to start tracking your environmental impact!</p>
              <Link to="/schedule-pickup">
                <Button size="sm" className="mt-2">Schedule a Pickup</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" /> Monthly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold text-primary">{thisMonthPickups.length}</p>
              <p className="text-xs text-muted-foreground">Pickups</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold text-primary">{monthlyRecycled.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kg Recycled</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-accent/50">
              <p className="text-2xl font-bold text-primary">
                {thisMonthPickups.reduce((s, p) => s + Number(p.actual_weight || p.estimated_weight || 0) * (ENV_IMPACT.co2_per_kg[p.waste_type as keyof typeof ENV_IMPACT.co2_per_kg] || 0), 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">kg CO₂ saved</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendation */}
      {recommendation?.shouldSchedule && (
        <Card className="border-secondary/40 bg-secondary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Smart Pickup Suggestion</p>
                <p className="text-sm text-muted-foreground mt-1">
                  It's been {recommendation.daysSince} days since your last pickup. Based on your history, you generate ~{recommendation.avgWeight}kg of {recommendation.wasteType} per pickup.
                </p>
                <Link to="/schedule-pickup">
                  <Button size="sm" className="mt-2">Schedule Now</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Pickups</p>
                <p className="text-2xl font-bold">{activePickups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Recycle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pickups</p>
                <p className="text-2xl font-bold">{completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Energy Saved</p>
                <p className="text-2xl font-bold">{totalEnergy.toFixed(0)} kWh</p>
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
                <p className="text-sm text-muted-foreground">Earnings</p>
                <p className="text-2xl font-bold">₹{totalPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eco Points Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eco Points per Kilogram</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Object.entries(ECO_POINTS).map(([type, pts]) => (
              <div key={type} className="text-center p-2 rounded-lg bg-accent/50">
                <p className="text-xs text-muted-foreground capitalize">{WASTE_LABELS[type]}</p>
                <p className="text-lg font-bold text-primary">{pts}</p>
                <p className="text-xs text-muted-foreground">pts/kg</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions Widget */}
      {activeSubscriptions && activeSubscriptions.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" /> Your Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activeSubscriptions as any[]).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(sub.waste_types || []).map((wt: string) => (
                      <Badge key={wt} variant="secondary" className="capitalize text-xs">
                        {WASTE_LABELS[wt] || wt}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground capitalize">{sub.frequency} · {sub.pickup_day}</span>
                </div>
              ))}
            </div>
            <Link to="/subscriptions">
              <Button variant="outline" size="sm" className="w-full mt-3">
                <CalendarClock className="w-4 h-4 mr-2" /> Manage Subscriptions
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!activeSubscriptions || activeSubscriptions.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6 text-center">
            <CalendarClock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Set up recurring pickups</p>
            <p className="text-xs text-muted-foreground mb-3">Never miss a pickup with automatic scheduling</p>
            <Link to="/subscriptions">
              <Button size="sm">Create Subscription</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Pickups</CardTitle>
        </CardHeader>
        <CardContent>
          {(!pickups || pickups.length === 0) ? (
            <p className="text-muted-foreground text-sm">No pickups yet. Schedule your first pickup!</p>
          ) : (
            <div className="space-y-3">
              {pickups.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{WASTE_LABELS[p.waste_type] || p.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{p.estimated_weight} kg · {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
