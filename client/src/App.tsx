import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import NotFound from "@/pages/not-found";

// Auth pages
import AuthRoot from "@/pages/auth";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import VerifyPage from "@/pages/auth/verify";
import SetupProfilePage from "@/pages/auth/setup-profile";

// Main application pages
import ChatPage from "@/pages/chat";
import ConversationPage from "@/pages/chat/conversation";
import GroupsPage from "@/pages/groups";
import ChannelsPage from "@/pages/channels";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/auth" component={AuthRoot} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/verify" component={VerifyPage} />
      <Route path="/auth/setup-profile" component={SetupProfilePage} />
      
      {/* Main app routes */}
      <Route path="/" component={ChatPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/chat/:id" component={ConversationPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/channels" component={ChannelsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={SettingsPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <ConversationProvider>
            <Router />
            <Toaster />
          </ConversationProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
