import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save, TrendingUp, Lock } from "lucide-react";



export default function SaveFilterModal({
  open,
  onOpenChange,
  onSave,
  canSave,
  savedFiltersCount,
  maxFilters,
  nextPlanName,
  blockedMessage,
}) {
  const [filterName, setFilterName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!filterName.trim() || isSaving) return;
    setIsSaving(true);
    const success = await onSave(filterName.trim());
    setIsSaving(false);
    if (success) {
      setFilterName("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setFilterName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {canSave ? (
              <>
                <Save className="h-5 w-5 text-accent" />
                Save Filter
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-destructive" />
                Limit Reached
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {canSave ? (
              `Give your filter a name to find it easily. (${savedFiltersCount}/${maxFilters} used)`
            ) : (
              blockedMessage
            )}
          </DialogDescription>
        </DialogHeader>

        {canSave ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filter-name">Filter Name</Label>
                <Input
                  id="filter-name"
                  placeholder="E.g., Supplier invoices"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!filterName.trim() || isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    You have reached the limit of {maxFilters} saved filters
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Delete an existing filter or upgrade to a higher plan.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {nextPlanName && (
                <Button className="bg-accent hover:bg-accent/90">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade to {nextPlanName}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
