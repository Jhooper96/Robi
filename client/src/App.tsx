import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Messages from "@/pages/messages";
import Properties from "@/pages/properties";
import Tenants from "@/pages/tenants";
import TenantProfile from "@/pages/tenant-profile";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import SmsTest from "@/pages/sms-test";
import SimulateIncoming from "@/pages/simulate-incoming";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/properties" component={Properties} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/tenant/:id" component={TenantProfile} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/sms-test" component={SmsTest} />
      <Route path="/simulate-sms" component={SimulateIncoming} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
