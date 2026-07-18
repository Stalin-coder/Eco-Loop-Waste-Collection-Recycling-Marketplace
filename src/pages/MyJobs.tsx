import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { STATUS_LABELS, STATUS_COLORS, WASTE_LABELS, WASTE_PRICES, ECO_POINTS } from '@/lib/constants';
import { Star as StarIcon, MapPin, Route, ImageIcon, Navigation } from 'lucide-react';
import PickupNavigationMap from '@/components/PickupNavigationMap';

const STATUS_FLOW: Record<string, string> = {
  accepted: 'collector_en_route',
  collector_en_route: 'collected',
  collected: 'completed',
};

export default function MyJobs() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weightInput, setWeightInput] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showRouteView, setShowRouteView] = useState(false);
  const [navigatingJobId, setNavigatingJobId] = useState<string | null>(null);

  // Fetch household profiles for active jobs
  const { data: jobs } = useQuery({
    queryKey: ['my-jobs', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('collector_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch profiles for all household_ids in active jobs
  const activeJobHouseholdIds = [...new Set((jobs || []).filter(j => j.status !== 'completed' && j.status !== 'cancelled').map(j => j.household_id))];
  const { data: householdProfiles } = useQuery({
    queryKey: ['household-profiles', activeJobHouseholdIds],
    queryFn: async () => {
      if (activeJobHouseholdIds.length === 0) return {};
      const { data } = await supabase
        .from('profiles')
        .select('id, name, phone, area')
        .in('id', activeJobHouseholdIds);
      const map: Record<string, any> = {};
      (data || []).forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: activeJobHouseholdIds.length > 0,
  });

  const updateStatus = async (jobId: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    const { error } = await supabase
      .from('pickup_requests')
      .update({ status: nextStatus as any })
      .eq('id', jobId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated!' });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
    }
  };

  const completeWithWeight = async (job: any) => {
    if (!profile || !weightInput) return;
    const weight = Number(weightInput);
    const price = WASTE_PRICES[job.waste_type] || 10;
    const amount = weight * price;
    const ecoPoints = Math.floor(weight * (ECO_POINTS[job.waste_type] || 5));

    const { error } = await supabase
      .from('pickup_requests')
      .update({
        status: 'completed' as any,
        actual_weight: weight,
        payment_amount: amount,
        reward_points: ecoPoints,
      })
      .eq('id', job.id);

    if (!error) {
      await supabase.from('payments').insert({
        user_id: job.household_id,
        pickup_request_id: job.id,
        amount,
        payment_type: 'cash',
      });
      await supabase.from('rewards').insert({
        user_id: job.household_id,
        points: ecoPoints,
        description: `♻️ ${weight}kg ${WASTE_LABELS[job.waste_type] || job.waste_type} collected`,
      });
      await supabase.from('notifications').insert({
        user_id: job.household_id,
        title: 'Pickup Completed! 🎉',
        message: `Your ${WASTE_LABELS[job.waste_type]} pickup is complete. You earned ₹${amount} and ${ecoPoints} eco points!`,
        type: 'pickup_completed',
        reference_id: job.id,
      });

      toast({ title: 'Pickup completed!', description: `₹${amount} paid, ${ecoPoints} eco points awarded.` });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      setCompletingId(null);
      setWeightInput('');
      setNavigatingJobId(null);
    }
  };

  const activeJobs = (jobs || []).filter(j => j.status !== 'completed' && j.status !== 'cancelled');
  const completedJobs = (jobs || []).filter(j => j.status === 'completed');

  const jobsByArea = activeJobs.reduce<Record<string, typeof activeJobs>>((acc, job) => {
    const area = job.area || 'Unknown Area';
    if (!acc[area]) acc[area] = [];
    acc[area].push(job);
    return acc;
  }, {});

  // Auto-open map for newly accepted jobs
  useEffect(() => {
    if (activeJobs.length > 0 && !navigatingJobId) {
      const justAccepted = activeJobs.find(j => j.status === 'accepted' || j.status === 'collector_en_route');
      if (justAccepted) {
        setNavigatingJobId(justAccepted.id);
      }
    }
  }, [activeJobs.length]);

  const navigatingJob = navigatingJobId ? activeJobs.find(j => j.id === navigatingJobId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Jobs</h1>
          {activeJobs.length > 1 && (
            <Button variant="outline" size="sm" onClick={() => setShowRouteView(!showRouteView)}>
              <Route className="w-4 h-4 mr-1" />
              {showRouteView ? 'List View' : 'Route View'}
            </Button>
          )}
        </div>

        {/* Embedded Navigation Map - Zomato style */}
        {navigatingJob && (
          <PickupNavigationMap
            job={navigatingJob}
            householdProfile={householdProfiles?.[navigatingJob.household_id] || null}
            onClose={() => setNavigatingJobId(null)}
          />
        )}

        {/* Route optimization view */}
        {showRouteView && activeJobs.length > 1 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Route className="w-5 h-5 text-primary" />
                <p className="font-semibold">Optimized Route</p>
                <span className="text-xs text-muted-foreground">({activeJobs.length} pickups)</span>
              </div>
              <div className="space-y-4">
                {Object.entries(jobsByArea).map(([area, areaJobs], areaIdx) => (
                  <div key={area}>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{area}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                        {areaJobs.length} pickup{areaJobs.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="ml-6 space-y-2">
                      {areaJobs.map((job, idx) => (
                        <div key={job.id} className="flex items-center gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{WASTE_LABELS[job.waste_type]}</span>
                            <span className="text-muted-foreground"> · {job.estimated_weight}kg · {job.pickup_address}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                            {STATUS_LABELS[job.status]}
                          </span>
                        </div>
                      ))}
                    </div>
                    {areaIdx < Object.keys(jobsByArea).length - 1 && (
                      <div className="ml-8 my-2 text-xs text-muted-foreground flex items-center gap-1">
                        ↓ Next area
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeJobs.length > 0 && !showRouteView && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Active ({activeJobs.length})</h2>
            {activeJobs.map(job => (
              <Card key={job.id} className={navigatingJobId === job.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}>
                <CardContent className="pt-4 pb-4">
                  {(job as any).photo_url && (
                    <img src={(job as any).photo_url} alt="Waste" className="w-full h-36 object-cover rounded-lg mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {WASTE_LABELS[job.waste_type] || job.waste_type}
                        {(job as any).photo_url && <ImageIcon className="w-3.5 h-3.5 inline ml-1 text-muted-foreground" />}
                      </p>
                      <p className="text-sm text-muted-foreground">{job.estimated_weight} kg · {job.pickup_address}</p>
                      {job.area && <p className="text-xs text-muted-foreground">📍 {job.area}, {job.city}</p>}
                      {householdProfiles?.[job.household_id] && (
                        <p className="text-xs text-muted-foreground mt-1">
                          👤 {householdProfiles[job.household_id].name}
                          {householdProfiles[job.household_id].phone && ` · ${householdProfiles[job.household_id].phone}`}
                        </p>
                      )}
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[job.status]}`}>
                        {STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Map Navigation Button */}
                      <Button size="sm" variant={navigatingJobId === job.id ? 'secondary' : 'outline'}
                        onClick={() => setNavigatingJobId(navigatingJobId === job.id ? null : job.id)}>
                        <Navigation className="w-4 h-4 mr-1" />
                        {navigatingJobId === job.id ? 'Hide Map' : 'Navigate'}
                      </Button>

                      {job.status === 'collected' ? (
                        <Dialog open={completingId === job.id} onOpenChange={open => { setCompletingId(open ? job.id : null); setWeightInput(''); }}>
                          <DialogTrigger asChild>
                            <Button size="sm">Verify Weight</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enter Actual Weight</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Actual Weight (kg)</Label>
                                <Input type="number" min="0.1" step="0.1" value={weightInput}
                                  onChange={e => setWeightInput(e.target.value)} />
                              </div>
                              {weightInput && (
                                <div className="p-3 rounded-lg bg-accent text-sm space-y-1">
                                  <p>Payment: <strong>₹{(Number(weightInput) * (WASTE_PRICES[job.waste_type] || 10)).toFixed(2)}</strong></p>
                                  <p>Eco Points: <strong>{Math.floor(Number(weightInput) * (ECO_POINTS[job.waste_type] || 5))} pts</strong></p>
                                </div>
                              )}
                              <Button onClick={() => completeWithWeight(job)} disabled={!weightInput} className="w-full">
                                Complete Pickup
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : STATUS_FLOW[job.status] ? (
                        <Button size="sm" onClick={() => updateStatus(job.id, job.status)}>
                          {job.status === 'accepted' ? 'En Route' : 'Mark Collected'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {completedJobs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Completed ({completedJobs.length})</h2>
            {completedJobs.slice(0, 10).map(job => (
              <Card key={job.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{WASTE_LABELS[job.waste_type] || job.waste_type}</p>
                      <p className="text-sm text-muted-foreground">{job.actual_weight || job.estimated_weight} kg · ₹{job.payment_amount || 0}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS.completed}`}>
                      {STATUS_LABELS.completed}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {(!jobs || jobs.length === 0) && (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No jobs yet.</CardContent></Card>
        )}
      </div>
    </DashboardLayout>
  );
}
