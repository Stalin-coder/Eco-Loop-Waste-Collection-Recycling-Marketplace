import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, ShoppingCart } from 'lucide-react';
import { WASTE_LABELS } from '@/lib/constants';

export default function RecyclerDashboard() {
  const { profile } = useAuth();

  const { data: inventory } = useQuery({
    queryKey: ['recycler-marketplace'],
    queryFn: async () => {
      const { data } = await supabase
        .from('waste_inventory')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: myOrders } = useQuery({
    queryKey: ['recycler-orders', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, waste_inventory(*)')
        .eq('recycler_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const totalSpent = (myOrders || []).reduce((sum, o) => sum + Number(o.total_price), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recycler Dashboard 🏭</h1>
        <p className="text-muted-foreground">Purchase recyclable materials from collectors</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Items</p>
                <p className="text-2xl font-bold">{(inventory || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Orders</p>
                <p className="text-2xl font-bold">{(myOrders || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">₹{totalSpent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {(!inventory || inventory.length === 0) ? (
            <p className="text-muted-foreground text-sm">No materials available yet.</p>
          ) : (
            <div className="space-y-3">
              {inventory.slice(0, 10).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{WASTE_LABELS[item.waste_type] || item.waste_type}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} kg available</p>
                  </div>
                  <p className="font-semibold text-sm text-primary">₹{item.price_per_kg}/kg</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
