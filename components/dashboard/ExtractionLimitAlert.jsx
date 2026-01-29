import { AlertTriangle, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";



export default function ExtractionLimitAlert({
  isMonthlyLimitReached,
  monthlyLimit,
  nextPlanName,
  onUpgrade,
}) {
  if (!isMonthlyLimitReached) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Monthly extraction quota reached
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                You have reached your quota of {monthlyLimit?.toLocaleString()} extractions this month.
                Quotas reset automatically each month.
              </span>
            </p>
          </div>
          {nextPlanName && (
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={onUpgrade}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
