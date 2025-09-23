import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  delta?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({ title, value, delta, icon, className }: StatsCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "number") {
      return val.toLocaleString();
    }
    return val;
  };

  const getDeltaIcon = (delta?: number) => {
    if (delta === undefined || delta === 0) {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
    if (delta > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getDeltaColor = (delta?: number) => {
    if (delta === undefined || delta === 0) {
      return "text-gray-500";
    }
    if (delta > 0) {
      return "text-green-600";
    }
    return "text-red-600";
  };

  return (
    <Card className={`${className} hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="text-3xl font-bold text-gray-900 mb-2">{formatValue(value)}</div>
            {delta !== undefined && (
              <div className={`flex items-center text-sm ${getDeltaColor(delta)}`}>
                {getDeltaIcon(delta)}
                <span className="mr-1 font-medium">
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                </span>
                <span className="text-gray-500">من الأسبوع الماضي</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


