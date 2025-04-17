import { MessageSquare, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type IconType = "messages" | "alert" | "pending" | "check";
type ColorType = "blue" | "red" | "yellow" | "green";

interface StatCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: ColorType;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, color, isLoading = false }: StatCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "messages":
        return <MessageSquare className="h-6 w-6 text-blue-600" />;
      case "alert":
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case "check":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <MessageSquare className="h-6 w-6 text-blue-600" />;
    }
  };

  const getColorClass = () => {
    switch (color) {
      case "blue":
        return "bg-blue-100";
      case "red":
        return "bg-red-100";
      case "yellow":
        return "bg-yellow-100";
      case "green":
        return "bg-green-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${getColorClass()}`}>
            {getIcon()}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-slate-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-slate-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  value
                )}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
