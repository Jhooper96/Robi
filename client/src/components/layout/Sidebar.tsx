import { Link, useLocation } from "wouter";
import { Home, MessageSquare, Building, Users, BarChart2, Settings, Phone, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className = "" }: SidebarProps) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const getLinkClass = (path: string) => {
    return `flex items-center px-2 py-2 text-sm font-medium rounded-md ${
      isActive(path)
        ? "text-white bg-primary"
        : "text-slate-700 hover:bg-slate-100"
    }`;
  };

  const getIconClass = (path: string) => {
    return `mr-3 h-6 w-6 ${
      isActive(path) ? "text-white" : "text-slate-500"
    }`;
  };

  return (
    <div className={`flex flex-col flex-grow pt-5 pb-5 overflow-y-auto bg-white border-r border-slate-200 ${className}`}>
      <div className="flex items-center flex-shrink-0 px-4 mb-5">
        <span className="text-xl font-bold text-primary">RoboTenant</span>
      </div>
      
      <div className="mt-2 flex flex-col flex-1">
        <nav className="flex-1 px-2 space-y-1">
          <Link href="/" className={getLinkClass("/")}>
            <Home className={getIconClass("/")} />
            Dashboard
          </Link>
          
          <Link href="/messages" className={getLinkClass("/messages")}>
            <MessageSquare className={getIconClass("/messages")} />
            Messages
          </Link>
          
          <Link href="/properties" className={getLinkClass("/properties")}>
            <Building className={getIconClass("/properties")} />
            Properties
          </Link>
          
          <Link href="/tenants" className={getLinkClass("/tenants")}>
            <Users className={getIconClass("/tenants")} />
            Tenants
          </Link>
          
          <Link href="/analytics" className={getLinkClass("/analytics")}>
            <BarChart2 className={getIconClass("/analytics")} />
            Analytics
          </Link>
          
          <Link href="/settings" className={getLinkClass("/settings")}>
            <Settings className={getIconClass("/settings")} />
            Settings
          </Link>
          
          <div className="pt-5 border-t border-slate-200 mt-5">
            <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase">Developer Tools</p>
            <Link href="/sms-test" className={getLinkClass("/sms-test")}>
              <Phone className={getIconClass("/sms-test")} />
              SMS Test
            </Link>
            <Link href="/simulate-sms" className={getLinkClass("/simulate-sms")}>
              <Send className={getIconClass("/simulate-sms")} />
              Simulate Incoming
            </Link>
          </div>
        </nav>
      </div>
      
      <div className="flex items-center px-4 mt-auto">
        <div className="flex-shrink-0">
          <Avatar>
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=property-manager" alt="Profile picture" />
            <AvatarFallback>PM</AvatarFallback>
          </Avatar>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-slate-700">Sarah Johnson</p>
          <p className="text-xs font-medium text-slate-500">Property Manager</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
