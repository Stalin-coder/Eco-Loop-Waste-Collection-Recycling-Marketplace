import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, CreditCard, Star, Shield, TrendingUp, CheckCircle, MapPin, Flame, IndianRupee, Calendar } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, WASTE_LABELS, WASTE_PRICES } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function CollectorDashboard() {
  const { profile } = useAuth();

  const { data: myJobs } = useQuery({
    queryKey: ['collector-jobs', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('collector_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: allJobs } = useQuery({
    queryKey: ['collector-all-jobs', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('collector_id', profile!.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: ratings } = useQuery({
    queryKey: ['collector-ratings', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ratings')
        .select('rating, comment, created_at')
        .eq('collector_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: payments } = useQuery({
    queryKey: ['collector-payments', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('user_id', profile!.id);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Demand zones - areas with most pending pickup requests
  const { data: demandZones } = useQuery({
    queryKey: ['demand-zones', profile?.city],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('area, city, waste_type, estimated_weight')
        .eq('status', 'requested')
        .is('collector_id', null);
      return data || [];
    },
    enabled: !!profile,
  });

  const completedJobs = (allJobs || []).filter(j => j.status === 'completed');
  const completedCount = completedJobs.length;
  const totalCount = (allJobs || []).length;
  const activeJobs = (myJobs || []).filter(j => j.status !== 'completed').length;
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Earnings calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const totalEarnings = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const todayEarnings = (payments || []).filter(p => new Date(p.created_at) >= todayStart).reduce((s, p) => s + Number(p.amount), 0);
  const weeklyEarnings = (payments || []).filter(p => new Date(p.created_at) >= weekStart).reduce((s, p) => s + Number(p.amount), 0);

  // Waste breakdown from completed jobs
  const wasteBreakdown: Record<string, number> = {};
  completedJobs.forEach(j => {
    const wt = j.waste_type;
    const weight = Number(j.actual_weight || j.estimated_weight || 0);
    wasteBreakdown[wt] = (wasteBreakdown[wt] || 0) + weight;
  });
  const totalWasteCollected = Object.values(wasteBreakdown).reduce((s, w) => s + w, 0);

  // Recommended pickup zones
  const zoneMap: Record<string, { count: number; totalWeight: number; city: string }> = {};
  (demandZones || []).forEach(r => {
    const area = r.area || 'Unknown';
    if (!zoneMap[area]) zoneMap[area] = { count: 0, totalWeight: 0, city: r.city || '' };
    zoneMap[area].count++;
    zoneMap[area].totalWeight += Number(r.estimated_weight || 0);
  });
  const hotZones = Object.entries(zoneMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  // Reliability score
  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : 'N/A';
  const reliabilityScore = (() => {
    if (totalCount === 0) return 0;
    const ratingScore = ratings && ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) / 5 * 40 : 20;
    const completionScore = (completedCount / Math.max(totalCount, 1)) * 40;
    const volumeScore = Math.min(completedCount / 20, 1) * 20;
    return Math.round(ratingScore + completionScore + volumeScore);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collector Dashboard 🚛</h1>
        <p className="text-muted-foreground">Manage your pickup jobs, earnings & routes</p>
      </div>

      {/* Reliability Score Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Reliability Score</p>
              <p className="text-3xl font-bold">{reliabilityScore}/100</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">⭐ {avgRating}</p>
              <p className="text-xs text-muted-foreground">{ratings?.length || 0} ratings</p>
            </div>
          </div>
          <Progress value={reliabilityScore} className="h-2.5" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Higher score = more pickup alerts</span>
            <span>{successRate}% success rate</span>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Earnings</p>
                <p className="text-2xl font-bold">₹{todayEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weekly Earnings</p>
                <p className="text-2xl font-bold">₹{weeklyEarnings}</p>
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
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₹{totalEarnings}</p>
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
                <p className="text-sm text-muted-foreground">Waste Collected</p>
                <p className="text-2xl font-bold">{totalWasteCollected.toFixed(1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{activeJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
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
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown + Recommended Zones side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" /> Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(wasteBreakdown).length === 0 ? (
              <p className="text-muted-foreground text-sm">Complete pickups to see your earnings breakdown.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(wasteBreakdown).map(([type, weight]) => {
                  const price = WASTE_PRICES[type] || 0;
                  const earning = weight * price;
                  return (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="capitalize">{type}</Badge>
                        <span className="text-sm text-muted-foreground">{weight.toFixed(1)} kg × ₹{price}/kg</span>
                      </div>
                      <span className="font-semibold text-primary">₹{earning.toFixed(0)}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 font-semibold">
                  <span>Estimated Total Value</span>
                  <span className="text-primary">
                    ₹{Object.entries(wasteBreakdown).reduce((s, [type, w]) => s + w * (WASTE_PRICES[type] || 0), 0).toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Pickup Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-destructive" /> Recommended Pickup Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotZones.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending pickup requests found right now.</p>
            ) : (
              <div className="space-y-3">
                {hotZones.map(([area, info], i) => (
                  <div key={area} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      {i === 0 ? <Flame className="w-4 h-4 text-destructive" /> : <MapPin className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {i === 0 && <span className="text-destructive">🔥 </span>}
                        High pickup demand in {area}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {info.count} pending request{info.count > 1 ? 's' : ''} · ~{info.totalWeight.toFixed(1)} kg
                        {info.city && ` · ${info.city}`}
                      </p>
                    </div>
                    <Badge variant={i === 0 ? 'destructive' : 'outline'} className="flex-shrink-0">
                      {i === 0 ? 'Hot' : `#${i + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ratings */}
      {ratings && ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary" /> Recent Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratings.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-secondary fill-secondary' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{r.comment || 'No comment'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {(!myJobs || myJobs.length === 0) ? (
            <p className="text-muted-foreground text-sm">No jobs yet. Check available pickups!</p>
          ) : (
            <div className="space-y-3">
              {myJobs.map(j => (
                <div key={j.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{WASTE_LABELS[j.waste_type] || j.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{j.estimated_weight} kg · {j.pickup_address}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[j.status]}`}>
                    {STATUS_LABELS[j.status]}
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
