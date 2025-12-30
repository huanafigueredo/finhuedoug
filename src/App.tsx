import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import People from "./pages/People";
import Settings from "./pages/Settings";
import Contas from "./pages/Contas";
import ChatIA from "./pages/ChatIA";
import Orcamentos from "./pages/Orcamentos";
import Metas from "./pages/Metas";
import Gamification from "./pages/Gamification";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/lancamentos" element={
                <ProtectedRoute><Transactions /></ProtectedRoute>
              } />
              <Route path="/novo" element={
                <ProtectedRoute><NewTransaction /></ProtectedRoute>
              } />
              <Route path="/pessoas" element={
                <ProtectedRoute><People /></ProtectedRoute>
              } />
              <Route path="/config" element={
                <ProtectedRoute><Settings /></ProtectedRoute>
              } />
              <Route path="/contas" element={
                <ProtectedRoute><Contas /></ProtectedRoute>
              } />
              <Route path="/chat-ia" element={
                <ProtectedRoute><ChatIA /></ProtectedRoute>
              } />
              <Route path="/orcamentos" element={
                <ProtectedRoute><Orcamentos /></ProtectedRoute>
              } />
              <Route path="/metas" element={
                <ProtectedRoute><Metas /></ProtectedRoute>
              } />
              <Route path="/gamificacao" element={
                <ProtectedRoute><Gamification /></ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
