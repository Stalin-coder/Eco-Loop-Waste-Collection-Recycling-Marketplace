import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { WASTE_LABELS } from '@/lib/constants';
import { ShoppingCart } from 'lucide-react';

export default function Marketplace() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState('');

  const { data: inventory } = useQuery({
    queryKey: ['marketplace-inventory'],
    queryFn: async () => {
      const { data } = await supabase
        .from('waste_inventory')
        .select('*, profiles!waste_inventory_collector_id_fkey(name, city)')
        .eq('status', 'available')
        .gt('quantity', 0)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const placeOrder = async () => {
    if (!profile || !selectedItem || !quantity) return;
    const qty = Number(quantity);
    if (qty > selectedItem.quantity) {
      toast({ title: 'Error', description: 'Quantity exceeds available stock', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('orders').insert({
      recycler_id: profile.id,
      inventory_id: selectedItem.id,
      quantity: qty,
      total_price: qty * selectedItem.price_per_kg,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Order placed!', description: `₹${(qty * selectedItem.price_per_kg).toFixed(2)} total` });
      queryClient.invalidateQueries({ queryKey: ['marketplace-inventory'] });
      setSelectedItem(null);
      setQuantity('');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-muted-foreground">Purchase recyclable materials from collectors</p>

        {(!inventory || inventory.length === 0) ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No materials available.</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">{WASTE_LABELS[item.waste_type] || item.waste_type}</span>
                    <span className="text-lg font-bold">₹{item.price_per_kg}/kg</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.quantity} kg available</p>
                  <p className="text-xs text-muted-foreground">Seller: {item.profiles?.name || 'Collector'} · {item.profiles?.city || ''}</p>
                  <Button size="sm" className="w-full" onClick={() => setSelectedItem(item)}>
                    <ShoppingCart className="w-4 h-4 mr-1" /> Buy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedItem} onOpenChange={open => { if (!open) setSelectedItem(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Place Order</DialogTitle></DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <p className="font-medium">{WASTE_LABELS[selectedItem.waste_type]} — ₹{selectedItem.price_per_kg}/kg</p>
                <p className="text-sm text-muted-foreground">Available: {selectedItem.quantity} kg</p>
                <div className="space-y-2">
                  <Label>Quantity (kg)</Label>
                  <Input type="number" min="0.1" max={selectedItem.quantity} step="0.1"
                    value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                {quantity && (
                  <div className="p-3 rounded-lg bg-accent text-sm">
                    Total: <strong>₹{(Number(quantity) * selectedItem.price_per_kg).toFixed(2)}</strong>
                  </div>
                )}
                <Button onClick={placeOrder} className="w-full" disabled={!quantity}>Confirm Order</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
