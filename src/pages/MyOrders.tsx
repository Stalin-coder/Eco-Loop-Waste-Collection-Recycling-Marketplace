import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { WASTE_LABELS } from '@/lib/constants';

const ORDER_STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-blue-100 text-blue-800',
  sold: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function MyOrders() {
  const { profile } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ['my-orders', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, waste_inventory(*)')
        .eq('recycler_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>

        {(!orders || orders.length === 0) ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">No orders yet.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <Card key={o.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{WASTE_LABELS[o.waste_inventory?.waste_type] || 'Material'}</p>
                      <p className="text-sm text-muted-foreground">{o.quantity} kg · ₹{o.total_price}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${ORDER_STATUS_COLORS[o.status] || 'bg-muted text-muted-foreground'}`}>
                      {o.status}
                    </span>
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
