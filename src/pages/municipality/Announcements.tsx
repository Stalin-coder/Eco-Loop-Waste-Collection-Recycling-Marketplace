import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Megaphone } from 'lucide-react';
import { INDIAN_CITIES } from '@/lib/constants';
import { format } from 'date-fns';

export default function Announcements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', city: profile?.city || '', area: '', target_role: 'household' });

  const { data: announcements } = useQuery({
    queryKey: ['announcements', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('municipality_user_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      // Insert announcement
      const { error } = await supabase.from('announcements').insert({
        municipality_user_id: profile!.id,
        title: form.title,
        message: form.message,
        city: form.city || null,
        area: form.area || null,
        target_role: form.target_role,
      });
      if (error) throw error;

      // Send as notifications to target users
      let query = supabase.from('profiles').select('id').eq('role', form.target_role as any);
      if (form.city) query = query.eq('city', form.city);
      if (form.area) query = query.eq('area', form.area);
      const { data: targets } = await query;

      if (targets && targets.length > 0) {
        const notifications = targets.map(t => ({
          user_id: t.id,
          title: `📢 ${form.title}`,
          message: form.message,
          type: 'announcement',
        }));
        await supabase.from('notifications').insert(notifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({ title: 'Announcement sent!' });
      setOpen(false);
      setForm({ title: '', message: '', city: profile?.city || '', area: '', target_role: 'household' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Plastic recycling drive this weekend" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Announcement details..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={form.target_role} onValueChange={v => setForm(f => ({ ...f, target_role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="household">Households</SelectItem>
                      <SelectItem value="collector">Collectors</SelectItem>
                      <SelectItem value="recycler">Recyclers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>City (optional)</Label>
                    <Select value={form.city || 'all'} onValueChange={v => setForm(f => ({ ...f, city: v === 'all' ? '' : v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Area (optional)</Label>
                    <Input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Miyapur" />
                  </div>
                </div>
                <Button className="w-full" onClick={() => createAnnouncement.mutate()} disabled={!form.title || !form.message || createAnnouncement.isPending}>
                  {createAnnouncement.isPending ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!announcements || announcements.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No announcements sent yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((a: any) => (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>To: <span className="capitalize">{a.target_role}s</span></span>
                        {a.city && <span>City: {a.city}</span>}
                        {a.area && <span>Area: {a.area}</span>}
                        <span>{format(new Date(a.created_at), 'PPp')}</span>
                      </div>
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
