import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RobiIcon from "@/components/RobiIcon";

const Header = () => {
  return (
    <div className="hidden md:flex items-center justify-between h-16 px-8 border-b border-slate-200 bg-white">
      <div className="text-xl font-bold text-primary">RoboTenant</div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-slate-500">Property Manager</div>
        <Avatar className="flex items-center justify-center bg-slate-100">
          <RobiIcon size={36} />
        </Avatar>
      </div>
    </div>
  );
};

export default Header;