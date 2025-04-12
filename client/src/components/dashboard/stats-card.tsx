import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";

type IconColor = "primary" | "success" | "secondary" | "default";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
  iconColor: IconColor;
  changePositive?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconColor, 
  changePositive 
}: StatsCardProps) {
  const getIconColorClass = (color: IconColor): string => {
    switch (color) {
      case "primary":
        return "bg-primary-50 text-primary";
      case "success":
        return "bg-success/10 text-success";
      case "secondary":
        return "bg-secondary-50 text-secondary-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getChangeColorClass = (): string => {
    return changePositive ? "text-success" : "text-slate-500";
  };

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${getIconColorClass(iconColor)}`}>
            <span className="material-icons">{icon}</span>
          </div>
        </div>
        <p className={`text-xs ${getChangeColorClass()} mt-2`}>{change}</p>
      </CardContent>
    </Card>
  );
}
