import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Gift, TrendingUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { REDEEM_OPTIONS, ECO_POINTS, WASTE_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function Rewards() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const { data: rewards } = useQuery({
    queryKey: ['rewards-list', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const totalPoints = (rewards || []).reduce((sum, r) => sum + r.points, 0);

  // Eco level
  const ecoLevel = totalPoints >= 1000 ? 'Eco Champion 🏆' : totalPoints >= 500 ? 'Green Warrior 🌿' : totalPoints >= 100 ? 'Eco Starter 🌱' : 'Beginner 🌍';
  const nextLevel = totalPoints >= 1000 ? { name: 'Legend', points: 2000 } : totalPoints >= 500 ? { name: 'Champion', points: 1000 } : totalPoints >= 100 ? { name: 'Warrior', points: 500 } : { name: 'Starter', points: 100 };

  const handleRedeem = (option: typeof REDEEM_OPTIONS[0]) => {
    if (totalPoints < option.points) {
      toast({ title: 'Not enough points', description: `You need ${option.points - totalPoints} more points.`, variant: 'destructive' });
    } else {
      toast({ title: 'Redemption Requested!', description: `${option.label} will be processed within 24 hours.` });
    }
  };

  // Group redemption options by category
  const categories = [...new Set(REDEEM_OPTIONS.map(o => o.category))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Eco Rewards</h1>

        {/* Points Overview */}
        <Card className="bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                <Star className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{ecoLevel}</p>
                <p className="text-4xl font-bold">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">eco points earned</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Next: {nextLevel.name}</span>
                <span>{totalPoints}/{nextLevel.points}</span>
              </div>
              <Progress value={Math.min((totalPoints / nextLevel.points) * 100, 100)} className="h-2.5" />
            </div>
          </CardContent>
        </Card>

        {/* Eco Points Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Earn Points Per Kilogram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(ECO_POINTS).map(([type, pts]) => (
                <div key={type} className="text-center p-3 rounded-xl bg-accent/50 border">
                  <p className="text-xs text-muted-foreground">{WASTE_LABELS[type]}</p>
                  <p className="text-xl font-bold text-primary">{pts}</p>
                  <p className="text-xs text-muted-foreground">pts/kg</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Redeem Options */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-secondary" /> Redeem Points
          </h2>
          {categories.map(cat => (
            <div key={cat} className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{cat}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {REDEEM_OPTIONS.filter(o => o.category === cat).map(opt => (
                  <Card key={opt.id} className={totalPoints >= opt.points ? 'border-primary/30' : 'opacity-60'}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs font-semibold text-primary">{opt.points} points</p>
                        </div>
                        <Button size="sm" variant={totalPoints >= opt.points ? 'default' : 'outline'}
                          disabled={totalPoints < opt.points} onClick={() => handleRedeem(opt)}>
                          Redeem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" /> Points History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!rewards || rewards.length === 0) ? (
              <p className="text-muted-foreground text-sm">No rewards yet. Schedule a pickup to start earning!</p>
            ) : (
              <div className="space-y-2">
                {rewards.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm">{r.description || 'Eco Points'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold text-primary">+{r.points} pts</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
