import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EditorPage from "@/pages/editor-page";
import FileManagementPage from "@/pages/file-management-page";
import AiTranslationPage from "@/pages/ai-translation-page";
import SettingsPage from "@/pages/settings-page";
import LandingPage from "@/pages/landing-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/app" component={HomePage} />
      <ProtectedRoute path="/app/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/app/editor" component={EditorPage} />
      <ProtectedRoute path="/app/files" component={FileManagementPage} />
      <ProtectedRoute path="/app/ai-translation" component={AiTranslationPage} />
      <ProtectedRoute path="/app/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
