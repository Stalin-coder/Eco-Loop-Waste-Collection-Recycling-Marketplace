import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home, Recycle, Truck, Building2, ShieldCheck, Bell, LogOut, Menu, X, User, Leaf,
  Package, ClipboardList, Star, CreditCard, BarChart3, Users, Building, Landmark, Megaphone, CalendarDays, CalendarClock
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const roleNavItems: Record<string, { label: string; path: string; icon: any }[]> = {
  household: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Schedule Pickup', path: '/schedule-pickup', icon: Package },
    { label: 'Subscriptions', path: '/subscriptions', icon: CalendarClock },
    { label: 'My Pickups', path: '/my-pickups', icon: ClipboardList },
    { label: 'Buildings', path: '/buildings', icon: Building },
    { label: 'Rewards', path: '/rewards', icon: Star },
    { label: 'Payments', path: '/payments', icon: CreditCard },
  ],
  collector: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Available Pickups', path: '/available-pickups', icon: Package },
    { label: 'My Jobs', path: '/my-jobs', icon: ClipboardList },
    { label: 'Inventory', path: '/inventory', icon: Recycle },
    { label: 'Earnings', path: '/earnings', icon: CreditCard },
  ],
  recycler: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Marketplace', path: '/marketplace', icon: Recycle },
    { label: 'My Orders', path: '/my-orders', icon: ClipboardList },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Pickups', path: '/admin/pickups', icon: Package },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ],
  municipality: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Cleanup Drives', path: '/municipality/drives', icon: CalendarDays },
    { label: 'Announcements', path: '/municipality/announcements', icon: Megaphone },
    { label: 'Analytics', path: '/municipality/analytics', icon: BarChart3 },
  ],
};

const roleIcons: Record<string, any> = {
  household: Home,
  collector: Truck,
  recycler: Building2,
  admin: ShieldCheck,
  municipality: Landmark,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = profile?.role || 'household';
  const navItems = roleNavItems[role] || roleNavItems.household;
  const RoleIcon = roleIcons[role] || Home;

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false);
      return count || 0;
    },
    enabled: !!profile?.id,
    refetchInterval: 30000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Leaf className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>EcoLoop</h1>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount && unreadCount > 0 ? (
            <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">{unreadCount}</Badge>
          ) : null}
        </Link>
        <Link
          to="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
        >
          <User className="w-4 h-4" />
          Profile
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>EcoLoop</span>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
