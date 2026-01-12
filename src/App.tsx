import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Screens
import AuthScreen from "@/screens/AuthScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { ConfirmNicheScreen } from "@/screens/ConfirmNicheScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { ProductFormScreen } from "@/screens/ProductFormScreen";
import { ProductsListScreen } from "@/screens/ProductsListScreen";
import { MovementsScreen } from "@/screens/MovementsScreen";
import { ReportsScreen } from "@/screens/ReportsScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { FinanceScreen } from "@/screens/FinanceScreen";
import { CustomersScreen } from "@/screens/CustomersScreen";
import { CaderninhoScreen } from "@/screens/CaderninhoScreen";
import { NewSaleScreen } from "@/screens/NewSaleScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/" element={<AuthScreen />} />
            
            {/* Onboarding Flow - requires auth but not business */}
            <Route path="/app/onboarding" element={
              <ProtectedRoute>
                <OnboardingScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/confirm-niche" element={
              <ProtectedRoute>
                <ConfirmNicheScreen />
              </ProtectedRoute>
            } />
            
            {/* Main App - requires auth and business */}
            <Route path="/app/dashboard" element={
              <ProtectedRoute requireBusiness>
                <DashboardScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/products" element={
              <ProtectedRoute requireBusiness>
                <ProductsListScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/products/new" element={
              <ProtectedRoute requireBusiness>
                <ProductFormScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/products/:id" element={
              <ProtectedRoute requireBusiness>
                <ProductFormScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/movements" element={
              <ProtectedRoute requireBusiness>
                <MovementsScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/finance" element={
              <ProtectedRoute requireBusiness>
                <FinanceScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/customers" element={
              <ProtectedRoute requireBusiness>
                <CustomersScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/caderninho" element={
              <ProtectedRoute requireBusiness>
                <CaderninhoScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/caderninho/nova-venda" element={
              <ProtectedRoute requireBusiness>
                <NewSaleScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/reports" element={
              <ProtectedRoute requireBusiness>
                <ReportsScreen />
              </ProtectedRoute>
            } />
            <Route path="/app/settings" element={
              <ProtectedRoute requireBusiness>
                <SettingsScreen />
              </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
