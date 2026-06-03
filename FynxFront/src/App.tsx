import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import routerBindings from '@refinedev/react-router-v6';
import Layout from "@/components/Layout"
import Index from "./pages/Index"
import Ranking from "./pages/Ranking"
import NotFound from "./pages/NotFound"
import Goal from "./pages/Goal"
import Login from "./pages/Login"
import Settings from "./pages/Settings"
import { dataProvider, authProvider, resourcesConfig } from "./refine/providers";
import {
  TransactionsCreate,
  TransactionsEdit,
  TransactionsList,
  TransactionsShow,
} from "./refine/resources/transactions";
import {
  CategoriesCreate,
  CategoriesEdit,
  CategoriesList,
  CategoriesShow,
} from "./refine/resources/categories";
import {
  SpendingLimitsCreate,
  SpendingLimitsEdit,
  SpendingLimitsList,
  SpendingLimitsShow,
} from "./refine/resources/spending-limits";
import {
  SavingGoalsCreate,
  SavingGoalsEdit,
  SavingGoalsList,
  SavingGoalsShow,
} from "./refine/resources/saving-goals";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedLayout = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <Layout>
      {children}
    </Layout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RefineKbarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              routerProvider={routerBindings}
              resources={resourcesConfig}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                disableTelemetry: true,
              }}
            >
              <Routes>
                {/* Rota de login sem Layout */}
                <Route path="/login" element={<Login />} />

                {/* Rotas com Layout (dashboard) - Protegidas */}
                <Route path="/dashboard" element={
                  <ProtectedLayout>
                    <Index />
                  </ProtectedLayout>
                } />
                <Route path="/ranking" element={
                  <ProtectedLayout>
                    <Ranking />
                  </ProtectedLayout>
                } />
                <Route path="/goals" element={
                  <ProtectedLayout>
                    <Goal />
                  </ProtectedLayout>
                } />

                <Route path="/settings" element={
                  <ProtectedLayout>
                    <Settings />
                  </ProtectedLayout>
                } />

                <Route path="/transactions" element={<ProtectedLayout><TransactionsList /></ProtectedLayout>} />
                <Route path="/transactions/create" element={<ProtectedLayout><TransactionsCreate /></ProtectedLayout>} />
                <Route path="/transactions/edit/:id" element={<ProtectedLayout><TransactionsEdit /></ProtectedLayout>} />
                <Route path="/transactions/show/:id" element={<ProtectedLayout><TransactionsShow /></ProtectedLayout>} />

                <Route path="/categories" element={<ProtectedLayout><CategoriesList /></ProtectedLayout>} />
                <Route path="/categories/create" element={<ProtectedLayout><CategoriesCreate /></ProtectedLayout>} />
                <Route path="/categories/edit/:id" element={<ProtectedLayout><CategoriesEdit /></ProtectedLayout>} />
                <Route path="/categories/show/:id" element={<ProtectedLayout><CategoriesShow /></ProtectedLayout>} />

                <Route path="/spending-limits" element={<ProtectedLayout><SpendingLimitsList /></ProtectedLayout>} />
                <Route path="/spending-limits/create" element={<ProtectedLayout><SpendingLimitsCreate /></ProtectedLayout>} />
                <Route path="/spending-limits/edit/:id" element={<ProtectedLayout><SpendingLimitsEdit /></ProtectedLayout>} />
                <Route path="/spending-limits/show/:id" element={<ProtectedLayout><SpendingLimitsShow /></ProtectedLayout>} />

                <Route path="/saving-goals" element={<ProtectedLayout><SavingGoalsList /></ProtectedLayout>} />
                <Route path="/saving-goals/create" element={<ProtectedLayout><SavingGoalsCreate /></ProtectedLayout>} />
                <Route path="/saving-goals/edit/:id" element={<ProtectedLayout><SavingGoalsEdit /></ProtectedLayout>} />
                <Route path="/saving-goals/show/:id" element={<ProtectedLayout><SavingGoalsShow /></ProtectedLayout>} />

                {/* Redirecionamento automático para login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <RefineKbar />
            </Refine>
          </BrowserRouter>
        </TooltipProvider>
      </RefineKbarProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
