import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { WASTE_TYPES, WASTE_LABELS, WEEKDAYS } from '@/lib/constants';
import { CalendarClock, Plus, Trash2, Package, RefreshCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Once a month' },
];

export default function Subscriptions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    waste_types: [] as string[],
    frequency: 'weekly',
    pickup_day: 'sunday',
    preferred_time: '',
    pickup_address: profile?.address || '',
    estimated_weight: '5',
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['pickup-subscriptions', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_subscriptions')
        .select('*')
        .eq('household_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: upcomingPickups } = useQuery({
    queryKey: ['upcoming-subscription-pickups', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('household_id', profile!.id)
        .eq('pickup_type', 'subscription')
        .in('status', ['requested', 'accepted', 'collector_en_route'])
        .order('preferred_time', { ascending: true });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pickup_subscriptions').insert({
        household_id: profile!.id,
        waste_types: form.waste_types,
        frequency: form.frequency,
        pickup_day: form.pickup_day,
        preferred_time: form.preferred_time || null,
        pickup_address: form.pickup_address,
        city: profile?.city,
        area: profile?.area,
        estimated_weight: Number(form.estimated_weight),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Subscription created!', description: 'Your recurring pickup has been set up.' });
      queryClient.invalidateQueries({ queryKey: ['pickup-subscriptions'] });
      setDialogOpen(false);
      setForm({ waste_types: [], frequency: 'weekly', pickup_day: 'sunday', preferred_time: '', pickup_address: profile?.address || '', estimated_weight: '5' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pickup_subscriptions')
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Subscription cancelled' });
      queryClient.invalidateQueries({ queryKey: ['pickup-subscriptions'] });
    },
  });

  const toggleWasteType = (type: string) => {
    setForm(f => ({
      ...f,
      waste_types: f.waste_types.includes(type)
        ? f.waste_types.filter(t => t !== type)
        : [...f.waste_types, type],
    }));
  };

  const activeSubscriptions = (subscriptions || []).filter((s: any) => s.is_active);
  const inactiveSubscriptions = (subscriptions || []).filter((s: any) => !s.is_active);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pickup Subscriptions 📅</h1>
            <p className="text-muted-foreground">Set up recurring waste pickups</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Subscription</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Pickup Subscription</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Waste Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {WASTE_TYPES.map(t => (
                      <label
                        key={t}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                          form.waste_types.includes(t) ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                        }`}
                      >
                        <Checkbox
                          checked={form.waste_types.includes(t)}
                          onCheckedChange={() => toggleWasteType(t)}
                        />
                        <span className="text-sm">{WASTE_LABELS[t]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label} — {o.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pickup Day</Label>
                  <Select value={form.pickup_day} onValueChange={v => setForm(f => ({ ...f, pickup_day: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map(d => (
                        <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Time</Label>
                  <Input
                    type="time"
                    value={form.preferred_time}
                    onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
                    placeholder="e.g. 09:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pickup Address</Label>
                  <Input
                    value={form.pickup_address}
                    onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))}
                    required
                    placeholder="Full address"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Weight per Pickup (kg)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.estimated_weight}
                    onChange={e => setForm(f => ({ ...f, estimated_weight: e.target.value }))}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || form.waste_types.length === 0}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Subscription'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" /> Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSubscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active subscriptions. Create one to get started!</p>
            ) : (
              <div className="space-y-4">
                {activeSubscriptions.map((sub: any) => (
                  <div key={sub.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {(sub.waste_types || []).map((wt: string) => (
                          <Badge key={wt} variant="secondary" className="capitalize">
                            {WASTE_LABELS[wt] || wt}
                          </Badge>
                        ))}
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 capitalize">
                        {sub.frequency}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Day</p>
                        <p className="font-medium capitalize">{sub.pickup_day}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Time</p>
                        <p className="font-medium">{sub.preferred_time || 'Any time'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Est. Weight</p>
                        <p className="font-medium">{sub.estimated_weight} kg</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Address</p>
                        <p className="font-medium truncate">{sub.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => cancelMutation.mutate(sub.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Pickups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" /> Upcoming Subscription Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!upcomingPickups || upcomingPickups.length === 0) ? (
              <p className="text-muted-foreground text-sm">No upcoming subscription pickups yet. Once the system generates pickups from your subscriptions, they'll appear here.</p>
            ) : (
              <div className="space-y-3">
                {upcomingPickups.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm capitalize">{WASTE_LABELS[p.waste_type] || p.waste_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.estimated_weight} kg · {p.preferred_time ? new Date(p.preferred_time).toLocaleDateString() : 'Pending'}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inactive Subscriptions */}
        {inactiveSubscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Past Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inactiveSubscriptions.map((sub: any) => (
                  <div key={sub.id} className="p-3 rounded-lg border opacity-60">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(sub.waste_types || []).map((wt: string) => (
                        <Badge key={wt} variant="outline" className="capitalize">
                          {WASTE_LABELS[wt] || wt}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="capitalize">{sub.frequency} · {sub.pickup_day}</Badge>
                      <Badge variant="destructive">Cancelled</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
