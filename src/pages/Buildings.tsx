import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { INDIAN_CITIES, WEEKDAYS } from '@/lib/constants';
import { Building2, Plus, Calendar, Users, Weight } from 'lucide-react';

export default function Buildings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', city: profile?.city || '', area: profile?.area || '',
    num_households: '', weekly_pickup_day: 'monday',
  });

  const { data: buildings } = useQuery({
    queryKey: ['my-buildings', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('buildings')
        .select('*')
        .eq('admin_user_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const addBuilding = async () => {
    if (!profile) return;
    const { error } = await supabase.from('buildings').insert({
      admin_user_id: profile.id,
      name: form.name,
      address: form.address,
      city: form.city,
      area: form.area,
      num_households: Number(form.num_households) || 1,
      weekly_pickup_day: form.weekly_pickup_day,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Building registered!' });
      queryClient.invalidateQueries({ queryKey: ['my-buildings'] });
      setOpen(false);
      setForm({ name: '', address: '', city: profile?.city || '', area: profile?.area || '', num_households: '', weekly_pickup_day: 'monday' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bulk Waste - Buildings</h1>
            <p className="text-muted-foreground">Register apartments & offices for bulk pickups</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Register Building</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Register Building</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Building Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Green Valley Apartments" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Area</Label>
                    <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Miyapur" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Number of Households</Label>
                  <Input type="number" min="1" value={form.num_households}
                    onChange={e => setForm(f => ({ ...f, num_households: e.target.value }))} placeholder="e.g. 50" />
                </div>
                <div className="space-y-2">
                  <Label>Weekly Pickup Day</Label>
                  <Select value={form.weekly_pickup_day} onValueChange={v => setForm(f => ({ ...f, weekly_pickup_day: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map(d => <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addBuilding} className="w-full" disabled={!form.name || !form.address}>Register Building</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!buildings || buildings.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No buildings registered yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Register your apartment or office to schedule bulk pickups.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {buildings.map(b => (
              <Card key={b.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <p className="font-semibold">{b.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{b.address}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.num_households} households</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.weekly_pickup_day ? b.weekly_pickup_day.charAt(0).toUpperCase() + b.weekly_pickup_day.slice(1) : 'Not set'}</span>
                      <span className="flex items-center gap-1"><Weight className="w-3.5 h-3.5" /> {b.total_waste_collected || 0} kg collected</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <a href={`/schedule-pickup?building=${b.id}`}>Schedule Bulk Pickup</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
