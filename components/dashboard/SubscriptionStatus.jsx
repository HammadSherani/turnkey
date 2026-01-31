import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw, Crown } from "lucide-react";



export default function SubscriptionStatus({
  planName,
  extractionsUsed,
  extractionsLimit,
  monthlyUsagePercent,
  onUpgrade,
  onRefresh,
}) {
  const getProgressColor = () => {
    if (monthlyUsagePercent >= 90) return "bg-destructive";
    if (monthlyUsagePercent >= 70) return "bg-yellow-500";
    return "bg-accent";
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
            <Crown className="h-4 w-4 text-accent" />
            <span className="font-semibold text-accent">
              {planName} Plan
            </span>
          </div>
          {/* <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button> */}
        </div>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Extractions this month</span>
            <span className="font-medium">
              {extractionsUsed?.toLocaleString()} / {extractionsLimit?.toLocaleString()}
            </span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${Math.min(monthlyUsagePercent, 100)}%` }}
            />
          </div>
          {/* <p className="text-xs text-muted-foreground">
            Quotas reset automatically each month.
          </p> */}
        </div>

        {/* Upgrade Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgrade}
          className="shrink-0"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Change Plan
        </Button>
      </div>
    </div>
  );
}
