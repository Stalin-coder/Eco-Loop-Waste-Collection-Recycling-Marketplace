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
import { WASTE_TYPES, WASTE_LABELS, WASTE_PRICES } from '@/lib/constants';
import { Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WasteType = Database['public']['Enums']['waste_type'];

export default function Inventory() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ waste_type: '', quantity: '', price_per_kg: '' });

  const { data: inventory } = useQuery({
    queryKey: ['my-inventory', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('waste_inventory')
        .select('*')
        .eq('collector_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const addItem = async () => {
    if (!profile) return;
    const { error } = await supabase.from('waste_inventory').insert({
      collector_id: profile.id,
      waste_type: form.waste_type as WasteType,
      quantity: Number(form.quantity),
      price_per_kg: Number(form.price_per_kg) || WASTE_PRICES[form.waste_type] || 10,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Item added to inventory!' });
      queryClient.invalidateQueries({ queryKey: ['my-inventory'] });
      setOpen(false);
      setForm({ waste_type: '', quantity: '', price_per_kg: '' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">My Inventory</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Waste Type</Label>
                  <Select value={form.waste_type} onValueChange={v => setForm(f => ({ ...f, waste_type: v, price_per_kg: String(WASTE_PRICES[v] || '') }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {WASTE_TYPES.map(t => <SelectItem key={t} value={t}>{WASTE_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity (kg)</Label>
                  <Input type="number" min="0.1" step="0.1" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Price per kg (₹)</Label>
                  <Input type="number" min="1" value={form.price_per_kg}
                    onChange={e => setForm(f => ({ ...f, price_per_kg: e.target.value }))} />
                </div>
                <Button onClick={addItem} className="w-full" disabled={!form.waste_type || !form.quantity}>Add to Inventory</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!inventory || inventory.length === 0) ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No inventory items yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {inventory.map(item => (
              <Card key={item.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{WASTE_LABELS[item.waste_type] || item.waste_type}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity} kg · ₹{item.price_per_kg}/kg</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800 capitalize">{item.status}</span>
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
