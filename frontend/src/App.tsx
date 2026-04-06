import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

// Farmer pages
import FarmerDashboard from "@/pages/farmer/Dashboard";
import MyFarms from "@/pages/farmer/MyFarms";
import FarmDetail from "@/pages/farmer/FarmDetail";
import AnimalProfile from "@/pages/farmer/AnimalProfile";
import FarmerVetRequests from "@/pages/farmer/VetRequests";
import VetRequestDetail from "@/pages/farmer/VetRequestDetail";
import FarmerSettings from "@/pages/farmer/Settings";

// Vet pages
import VetDashboard from "@/pages/vet/Dashboard";
import CaseQueue from "@/pages/vet/CaseQueue";
import CaseDetail from "@/pages/vet/CaseDetail";
import FollowUpTracker from "@/pages/vet/FollowUpTracker";
import VetSettings from "@/pages/vet/Settings";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminFarmers from "@/pages/admin/Farmers";
import AdminVets from "@/pages/admin/Vets";
import AdminFarms from "@/pages/admin/Farms";
import AdminLivestock from "@/pages/admin/Livestock";
import AdminRequests from "@/pages/admin/Requests";
import AdminSettings from "@/pages/admin/Settings";
import AdminEmail from "@/pages/admin/Email";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (user?.role === "admin") {
    return (
      <AppLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/farmers" element={<AdminFarmers />} />
          <Route path="/admin/vets" element={<AdminVets />} />
          <Route path="/admin/farms" element={<AdminFarms />} />
          <Route path="/admin/livestock" element={<AdminLivestock />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/email" element={<AdminEmail />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  if (user?.role === "vet") {
    return (
      <AppLayout>
        <Routes>
          <Route path="/vet/dashboard" element={<VetDashboard />} />
          <Route path="/vet/cases" element={<CaseQueue />} />
          <Route path="/vet/cases/:id" element={<CaseDetail />} />
          <Route path="/vet/followups" element={<FollowUpTracker />} />
          <Route path="/vet/settings" element={<VetSettings />} />
          <Route path="*" element={<Navigate to="/vet/dashboard" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  // Farmer
  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<FarmerDashboard />} />
        <Route path="/farms" element={<MyFarms />} />
        <Route path="/farms/:id" element={<FarmDetail />} />
        <Route path="/animals/:id" element={<AnimalProfile />} />
        <Route path="/vet-requests" element={<FarmerVetRequests />} />
        <Route path="/vet-requests/:id" element={<VetRequestDetail />} />
        <Route path="/settings" element={<FarmerSettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
