import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATUS_LABELS, STATUS_COLORS, WASTE_LABELS } from '@/lib/constants';

export default function AdminPickups() {
  const { data: pickups } = useQuery({
    queryKey: ['admin-all-pickups'],
    queryFn: async () => {
      const { data: pickupData } = await supabase
        .from('pickup_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!pickupData || pickupData.length === 0) return [];
      const hIds = [...new Set(pickupData.map(p => p.household_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', hIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p]));
      return pickupData.map(p => ({ ...p, profiles: pMap.get(p.household_id) || null }));
    },
  }) as { data: any[] | undefined };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">All Pickups</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pickups || []).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.profiles?.name || '—'}</TableCell>
                      <TableCell>{WASTE_LABELS[p.waste_type] || p.waste_type}</TableCell>
                      <TableCell>{p.actual_weight || p.estimated_weight} kg</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
