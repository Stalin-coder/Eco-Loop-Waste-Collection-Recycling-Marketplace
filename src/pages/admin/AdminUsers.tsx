import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Clock } from 'lucide-react';

const roleBadgeColors: Record<string, string> = {
  household: 'bg-blue-100 text-blue-800',
  collector: 'bg-orange-100 text-orange-800',
  recycler: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  municipality: 'bg-green-100 text-green-800',
};

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const verifyCollector = async (userId: string, name: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ verified: true })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Account Verified ✅',
      message: 'Your collector account has been verified by admin. You can now accept pickups.',
      type: 'verification',
    });
    toast({ title: 'Verified', description: `${name} can now accept pickups.` });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || []).map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleBadgeColors[u.role] || ''}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>{u.city || '—'}</TableCell>
                      <TableCell>
                        {u.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />Verified</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700"><Clock className="w-3.5 h-3.5" />Pending</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {u.role === 'collector' && !u.verified && (
                          <Button size="sm" onClick={() => verifyCollector(u.id, u.name)}>Verify</Button>
                        )}
                      </TableCell>
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
