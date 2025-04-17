import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import RobiIcon from "@/components/RobiIcon";

interface MobileNavProps {
  onMenuClick: () => void;
}

const MobileNav = ({ onMenuClick }: MobileNavProps) => {
  return (
    <div className="md:hidden bg-white w-full border-b border-slate-200 fixed top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-600 focus:outline-none"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="ml-2 text-xl font-bold text-primary">RoboTenant</span>
        </div>
        <div>
          <Avatar className="flex items-center justify-center bg-slate-100">
            <RobiIcon size={32} />
          </Avatar>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
