import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_LABELS, STATUS_COLORS, WASTE_LABELS } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { Plus, Star, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MyPickups() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingPickup, setRatingPickup] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: pickups } = useQuery({
    queryKey: ['my-pickups', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('household_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const { data: existingRatings } = useQuery({
    queryKey: ['my-ratings', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ratings')
        .select('pickup_request_id')
        .eq('household_id', profile!.id);
      return new Set((data || []).map(r => r.pickup_request_id));
    },
    enabled: !!profile?.id,
  });

  // Realtime: update pickup status in real-time for household
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('my-pickups-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pickup_requests',
          filter: `household_id=eq.${profile.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'accepted') {
            toast({ title: 'Collector Assigned! 🚛', description: 'A collector has been assigned to your pickup.' });
          } else if (updated.status === 'collector_en_route') {
            toast({ title: 'Collector En Route! 🛣️', description: 'Your collector is on the way.' });
          } else if (updated.status === 'completed') {
            toast({ title: 'Pickup Completed! 🎉', description: `You earned ₹${updated.payment_amount || 0} and ${updated.reward_points || 0} eco points!` });
          }
          queryClient.invalidateQueries({ queryKey: ['my-pickups'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, queryClient, toast]);

  const cancelPickup = async (pickupId: string) => {
    setCancellingId(pickupId);
    const { error } = await supabase
      .from('pickup_requests')
      .update({ status: 'cancelled' as any })
      .eq('id', pickupId)
      .eq('household_id', profile!.id)
      .eq('status', 'requested'); // can only cancel open pickups

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pickup cancelled', description: 'Your pickup request has been cancelled.' });
      queryClient.invalidateQueries({ queryKey: ['my-pickups'] });
    }
    setCancellingId(null);
  };

  const submitRating = async () => {
    if (!profile || !ratingPickup) return;
    const { error } = await supabase.from('ratings').insert({
      pickup_request_id: ratingPickup.id,
      household_id: profile.id,
      collector_id: ratingPickup.collector_id,
      rating: ratingValue,
      comment: ratingComment || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rating submitted!', description: 'Thank you for your feedback.' });
      queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      setRatingPickup(null);
      setRatingComment('');
      setRatingValue(5);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Pickups</h1>
          <Link to="/schedule-pickup">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Pickup</Button>
          </Link>
        </div>

        {(!pickups || pickups.length === 0) ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No pickups scheduled yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pickups.map(p => {
              const canRate = p.status === 'completed' && p.collector_id && !existingRatings?.has(p.id);
              const canCancel = p.status === 'requested';
              return (
                <Card key={p.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{WASTE_LABELS[p.waste_type] || p.waste_type}</p>
                        <p className="text-sm text-muted-foreground">{p.estimated_weight} kg · {p.pickup_address}</p>
                        {p.preferred_time && (
                          <p className="text-xs text-muted-foreground">Preferred: {new Date(p.preferred_time).toLocaleString()}</p>
                        )}
                        {p.actual_weight && (
                          <p className="text-sm text-primary font-medium mt-1">
                            Actual: {p.actual_weight} kg · ₹{p.payment_amount} · {p.reward_points} pts
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                        {canCancel && (
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                            onClick={() => cancelPickup(p.id)}
                            disabled={cancellingId === p.id}>
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            {cancellingId === p.id ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                        {canRate && (
                          <Button size="sm" variant="outline" onClick={() => { setRatingPickup(p); setRatingValue(5); setRatingComment(''); }}>
                            <Star className="w-3.5 h-3.5 mr-1 text-secondary" /> Rate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!ratingPickup} onOpenChange={open => { if (!open) setRatingPickup(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rate Collector</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How was your pickup experience for {ratingPickup && (WASTE_LABELS[ratingPickup.waste_type] || ratingPickup.waste_type)}?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRatingValue(s)} className="p-1 transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 ${s <= ratingValue ? 'text-secondary fill-secondary' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Comment (optional)</Label>
                <Textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                  placeholder="Share your experience..." rows={3} />
              </div>
              <Button onClick={submitRating} className="w-full">Submit Rating</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
