import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { WASTE_LABELS, WASTE_TYPES, INDIAN_CITIES, WASTE_PRICES } from '@/lib/constants';
import { MapPin, Clock, User, Building2, Zap, ImageIcon, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AvailablePickups() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cityFilter, setCityFilter] = useState(profile?.city || 'all');
  const [wasteFilter, setWasteFilter] = useState('all');
  const [accepting, setAccepting] = useState<string | null>(null);

  const { data: pickups } = useQuery({
    queryKey: ['available-pickups', cityFilter, wasteFilter],
    queryFn: async () => {
      let query = supabase
        .from('pickup_requests')
        .select('*')
        .eq('status', 'requested')
        .is('collector_id', null)
        .order('created_at', { ascending: false });

      if (cityFilter && cityFilter !== 'all') query = query.eq('city', cityFilter);
      if (wasteFilter && wasteFilter !== 'all') query = query.eq('waste_type', wasteFilter as any);

      const { data: pickupData } = await query;
      if (!pickupData || pickupData.length === 0) return [];

      const householdIds = [...new Set(pickupData.map(p => p.household_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, phone, city, area')
        .in('id', householdIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return pickupData.map(p => ({ ...p, profiles: profileMap.get(p.household_id) || null }));
    },
  }) as { data: any[] | undefined };

  // Realtime subscription - auto-remove assigned/cancelled pickups, alert only for nearby pickups
  useEffect(() => {
    const channel = supabase
      .channel('available-pickups-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pickup_requests',
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status !== 'requested' || updated.collector_id) {
            queryClient.invalidateQueries({ queryKey: ['available-pickups'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pickup_requests',
        },
        (payload) => {
          const inserted = payload.new as any;
          if (inserted.status === 'requested') {
            // Only alert collectors in the same city (within ~20km radius approximation)
            const collectorCity = profile?.city?.toLowerCase().trim();
            const pickupCity = (inserted.city || '').toLowerCase().trim();
            const isSameCity = !collectorCity || !pickupCity || collectorCity === pickupCity;

            queryClient.invalidateQueries({ queryKey: ['available-pickups'] });

            if (isSameCity) {
              toast({
                title: 'New Pickup Nearby! 📦',
                description: `${WASTE_LABELS[inserted.waste_type] || inserted.waste_type} · ${inserted.estimated_weight}kg in ${inserted.area || inserted.city || 'your area'}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast, profile?.city]);

  const acceptPickup = async (pickup: any) => {
    if (!profile) return;
    if (profile.role === 'collector' && !profile.verified) {
      toast({
        title: 'Verification Pending',
        description: 'Your collector account is awaiting admin verification. You cannot accept pickups yet.',
        variant: 'destructive',
      });
      return;
    }
    setAccepting(pickup.id);

    // First-accept logic: only update if still in 'requested' status
    const { data: updated, error } = await supabase
      .from('pickup_requests')
      .update({ collector_id: profile.id, status: 'accepted' as any })
      .eq('id', pickup.id)
      .eq('status', 'requested')
      .is('collector_id', null)
      .select();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (!updated || updated.length === 0) {
      // Race condition: another collector already accepted
      toast({
        title: 'Pickup Already Assigned',
        description: 'Another collector has already accepted this pickup.',
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['available-pickups'] });
    } else {
      // Successfully assigned - notify household
      await supabase.from('notifications').insert({
        user_id: pickup.household_id,
        title: 'Collector Assigned! 🚛',
        message: `${profile.name} has been assigned to your ${WASTE_LABELS[pickup.waste_type] || pickup.waste_type} pickup request.`,
        type: 'pickup_accepted',
        reference_id: pickup.id,
      });

      // Send household details to collector as notification
      const householdName = pickup.profiles?.name || 'Customer';
      const householdPhone = pickup.profiles?.phone ? ` · Phone: ${pickup.profiles.phone}` : '';
      const householdArea = pickup.profiles?.area ? ` · Area: ${pickup.profiles.area}` : '';
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Pickup Details 📋',
        message: `Customer: ${householdName}${householdPhone}${householdArea}\nAddress: ${pickup.pickup_address}\nWaste: ${WASTE_LABELS[pickup.waste_type]} · ${pickup.estimated_weight}kg`,
        type: 'pickup_details',
        reference_id: pickup.id,
      });

      toast({ title: 'Pickup accepted! 🎉', description: `Navigating to pickup for ${householdName}` });
      queryClient.invalidateQueries({ queryKey: ['available-pickups'] });
      queryClient.invalidateQueries({ queryKey: ['collector-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });

      // Redirect to My Jobs to show embedded map navigation
      navigate('/my-jobs');
    }
    setAccepting(null);
  };

  // Group by area
  const pickupsByArea = (pickups || []).reduce<Record<string, any[]>>((acc, p) => {
    const area = p.area || p.profiles?.area || 'Other';
    if (!acc[area]) acc[area] = [];
    acc[area].push(p);
    return acc;
  }, {});

  const estimatedEarnings = (pickup: any) => {
    const price = WASTE_PRICES[pickup.waste_type] || 10;
    return (price * pickup.estimated_weight).toFixed(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Available Pickups</h1>
            <p className="text-muted-foreground">{(pickups || []).length} pickup request{(pickups || []).length !== 1 ? 's' : ''} available</p>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Radio className="w-3 h-3 text-green-500 animate-pulse" />
            Live
          </Badge>
        </div>

        {profile?.role === 'collector' && !profile?.verified && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="pt-6 text-sm">
              ⏳ Your collector account is <strong>pending admin verification</strong>. You'll be able to accept pickups once an admin approves your account.
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 flex-wrap">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={wasteFilter} onValueChange={setWasteFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {WASTE_TYPES.map(t => <SelectItem key={t} value={t}>{WASTE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {(!pickups || pickups.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No pickup requests available in your area. New pickups will appear here in real-time.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(pickupsByArea).map(([area, areaPickups]) => (
              <div key={area}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">{area}</h2>
                  <Badge variant="secondary" className="text-xs">{areaPickups.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {areaPickups.map((p: any) => (
                    <Card key={p.id} className="overflow-hidden border-l-4 border-l-primary/60">
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          {p.photo_url && (
                            <img src={p.photo_url} alt="Waste" className="w-full h-32 object-cover rounded-lg" />
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{WASTE_LABELS[p.waste_type] || p.waste_type}</span>
                              {p.photo_url && <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                              {p.pickup_type === 'bulk' && (
                                <Badge variant="secondary" className="text-xs"><Building2 className="w-3 h-3 mr-0.5" />Bulk</Badge>
                              )}
                            </div>
                            <span className="text-sm font-bold">{p.estimated_weight} kg</span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{p.pickup_address}</div>
                            {p.profiles?.name && (
                              <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" />{p.profiles.name}</div>
                            )}
                            {p.preferred_time && (
                              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{new Date(p.preferred_time).toLocaleString()}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/50 text-sm">
                            <Zap className="w-4 h-4 text-secondary" />
                            <span>Est. earnings: <strong className="text-primary">₹{estimatedEarnings(p)}</strong></span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => acceptPickup(p)}
                              disabled={accepting === p.id}>
                              {accepting === p.id ? 'Accepting...' : 'Accept Pickup'}
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">Ignore</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
