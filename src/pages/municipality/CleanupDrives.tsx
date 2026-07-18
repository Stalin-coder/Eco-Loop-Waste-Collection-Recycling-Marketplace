import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { INDIAN_CITIES } from '@/lib/constants';
import { format } from 'date-fns';

export default function CleanupDrives() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', city: profile?.city || '', area: '', drive_date: '' });

  const { data: drives } = useQuery({
    queryKey: ['cleanup-drives', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('cleanup_drives')
        .select('*')
        .eq('municipality_user_id', profile!.id)
        .order('drive_date', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createDrive = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('cleanup_drives').insert({
        municipality_user_id: profile!.id,
        title: form.title,
        description: form.description,
        city: form.city,
        area: form.area || null,
        drive_date: new Date(form.drive_date).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleanup-drives'] });
      toast({ title: 'Cleanup drive scheduled!' });
      setOpen(false);
      setForm({ title: '', description: '', city: profile?.city || '', area: '', drive_date: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusColor: Record<string, string> = {
    upcoming: 'bg-accent text-accent-foreground',
    active: 'bg-primary/10 text-primary',
    completed: 'bg-muted text-muted-foreground',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Cleanup Drives</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Schedule Drive</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule a Cleanup Drive</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekend Plastic Drive" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details about the drive..." />
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
                    <Label>Area (optional)</Label>
                    <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Miyapur" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={form.drive_date} onChange={e => setForm(f => ({ ...f, drive_date: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={() => createDrive.mutate()} disabled={!form.title || !form.city || !form.drive_date || createDrive.isPending}>
                  {createDrive.isPending ? 'Scheduling...' : 'Schedule Drive'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!drives || drives.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No cleanup drives scheduled yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {drives.map((d: any) => (
              <Card key={d.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{d.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor[d.status] || ''}`}>
                      {d.status}
                    </span>
                  </div>
                  {d.description && <p className="text-sm text-muted-foreground mb-3">{d.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.city}{d.area ? `, ${d.area}` : ''}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(d.drive_date), 'PPp')}</span>
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
