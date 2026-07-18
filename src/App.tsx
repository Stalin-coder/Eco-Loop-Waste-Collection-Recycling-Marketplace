import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SchedulePickup from "./pages/SchedulePickup";
import MyPickups from "./pages/MyPickups";
import AvailablePickups from "./pages/AvailablePickups";
import MyJobs from "./pages/MyJobs";
import Inventory from "./pages/Inventory";
import Marketplace from "./pages/Marketplace";
import MyOrders from "./pages/MyOrders";
import Rewards from "./pages/Rewards";
import Payments from "./pages/Payments";
import Earnings from "./pages/Earnings";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Buildings from "./pages/Buildings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPickups from "./pages/admin/AdminPickups";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import CleanupDrives from "./pages/municipality/CleanupDrives";
import MunicipalityAnnouncements from "./pages/municipality/Announcements";
import MunicipalityAnalytics from "./pages/municipality/MunicipalityAnalytics";
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/schedule-pickup" element={<ProtectedRoute><SchedulePickup /></ProtectedRoute>} />
    <Route path="/my-pickups" element={<ProtectedRoute><MyPickups /></ProtectedRoute>} />
    <Route path="/available-pickups" element={<ProtectedRoute><AvailablePickups /></ProtectedRoute>} />
    <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
    <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
    <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
    <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
    <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
    <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/buildings" element={<ProtectedRoute><Buildings /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
    <Route path="/admin/pickups" element={<ProtectedRoute><AdminPickups /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
    <Route path="/municipality/drives" element={<ProtectedRoute><CleanupDrives /></ProtectedRoute>} />
    <Route path="/municipality/announcements" element={<ProtectedRoute><MunicipalityAnnouncements /></ProtectedRoute>} />
    <Route path="/municipality/analytics" element={<ProtectedRoute><MunicipalityAnalytics /></ProtectedRoute>} />
    <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
