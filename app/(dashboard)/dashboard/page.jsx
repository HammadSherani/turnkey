"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, TrendingUp, RefreshCw } from "lucide-react";
import { useSubscriptionQuotas } from "@/hooks/useSubscriptionQuotas";
import { useOutlookConnection } from "@/hooks/useOutlookConnection";
import FiltersSidebar from "@/components/dashboard/FiltersSidebar";
import ExportPanel from "@/components/dashboard/ExportPanel";
import OutlookConnectModal from "@/components/dashboard/OutlookConnectModal";
import SaveFilterModal from "@/components/dashboard/SaveFilterModal";
import ExtractionLimitAlert from "@/components/dashboard/ExtractionLimitAlert";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function Dashboard() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [pendingFilterData, setPendingFilterData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [isConnectingOutlook, setIsConnectingOutlook] = useState(false);
  // Subscription quotas hook
  const quotas = useSubscriptionQuotas();
 
  // Outlook connection hook
  const outlook = useOutlookConnection();
  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth?mode=login");
        return;
      }
      setUser(session.user);
      setIsAuthLoading(false);
    };
    // checkAuth();
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    //   if (event === "SIGNED_OUT" || !session) {
    //     router.push("/auth?mode=login");
    //   } else if (session) {
    //     setUser(session.user);
    //     setIsAuthLoading(false);
    //   }
    // });
    // return () => subscription.unsubscribe();
  }, [router]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
  const handleExtract = async () => {
    if (!outlook.isConnected) {
      setShowConnectModal(true);
      return;
    }
    // Check extraction limits
    if (!quotas.canExtract) {
      const message = quotas.getExtractionBlockedMessage();
      if (message) {
        toast.error(message);
      }
      return;
    }
    // Simulation de l'extraction avec consommation backend
    setIsExtracting(true);
   
    const result = await quotas.consumeExtraction();
   
    setIsExtracting(false);
   
    if (result.success) {
      setHasExtracted(true);
      setExtractedData([]);
      toast.success("Extraction completed successfully!");
    } else {
      toast.error(result.error || "Error during extraction");
    }
  };
  const handleOpenSaveModal = (data) => {
    setPendingFilterData(data);
    setShowSaveFilterModal(true);
  };
  const handleSaveFilter = async (name) => {
    if (!pendingFilterData) return false;
    const success = await quotas.saveFilter(name, pendingFilterData);
    if (success) {
      toast.success(`Filter "${name}" saved successfully!`);
      setPendingFilterData(null);
    }
    return success;
  };
  const handleOutlookConnect = async () => {
    setIsConnectingOutlook(true);
    const result = await outlook.connect();
    if (!result.success) {
      setIsConnectingOutlook(false);
      toast.error(result.error || "Error connecting to Outlook");
    }
    // If success, user will be redirected to Microsoft login
  };
  const handleDownload = () => {
    console.log("Downloading Excel file...");
    toast.success("Download started!");
  };
  const handleManageSubscription = async () => {
    const result = await quotas.openCustomerPortal();
    if (!result.success) {
      // If test mode, show info message
      if (result.error?.includes("mode test")) {
        toast.info(result.error);
      } else if (result.error?.includes("Aucun abonnement")) {
        // Redirect to pricing section
        router.push("/#pricing");
      } else {
        toast.error(result.error || "Error opening portal");
      }
    }
  };
//   if (isAuthLoading || quotas.isLoading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p className="text-sm text-muted-foreground">
//             {isAuthLoading ? "Verifying authentication..." : "Loading your subscription..."}
//           </p>
//         </div>
//       </div>
//     );
//   }
  // If not subscribed, show message
//   if (!quotas.isSubscribed) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <div className="max-w-md text-center space-y-4 p-6">
//           <h1 className="text-2xl font-bold text-foreground">No Active Subscription</h1>
//           <p className="text-muted-foreground">
//             You don't have an active subscription. Choose a plan to start using Inbox2Excel.
//           </p>
//           <div className="flex gap-3 justify-center">
//             <Button onClick={() => router.push("/auth")}>
//               <TrendingUp className="h-4 w-4 mr-2" />
//               Choose a Plan
//             </Button>
//             <Button variant="outline" onClick={handleLogout}>
//               <LogOut className="h-4 w-4 mr-2" />
//               Log Out
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">I2E</span>
              </div>
              <span className="font-semibold text-lg text-foreground">Inbox2Excel</span>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Statut Outlook */}
              {outlook.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-success/10 text-success">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  {outlook.email ? `Outlook (${outlook.email})` : "Outlook connected"}
                </div>
              ) : outlook.isExpired ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConnectModal(true)}
                  className="gap-2 border-warning text-warning"
                >
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  Reconnect Outlook
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConnectModal(true)}
                  className="gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Connect to Outlook
                </Button>
              )}
              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Subscription Status Bar */}
        <SubscriptionStatus
          planName={quotas.planName}
          extractionsUsed={quotas.extractionsUsedThisMonth}
          extractionsLimit={quotas.limits.extractionsPerMonth}
          monthlyUsagePercent={quotas.monthlyUsagePercent}
          onUpgrade={handleManageSubscription}
          onRefresh={quotas.refreshSubscription}
        />
        {/* Alert si limite atteinte */}
        <ExtractionLimitAlert
          isMonthlyLimitReached={quotas.isMonthlyLimitReached}
          monthlyLimit={quotas.limits.extractionsPerMonth}
          nextPlanName={quotas.nextPlanName}
          onUpgrade={handleManageSubscription}
        />
        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne gauche - Filtres */}
          <div className="lg:col-span-4 space-y-4">
            <FiltersSidebar
              plan={quotas.plan || "starter"}
              maxFieldsPerFilter={quotas.maxFieldsPerFilter}
              nextPlanName={quotas.nextPlanName}
              onExtract={handleExtract}
              isExtracting={isExtracting}
              isQuotaReached={!quotas.canExtract}
              onSaveFilter={handleOpenSaveModal}
              canSaveFilter={quotas.canSaveFilter}
              savedFiltersCount={quotas.savedFiltersCount}
              maxFilters={quotas.limits.maxFilters}
              savedFilters={quotas.savedFilters}
              onDeleteFilter={async (id) => {
                const success = await quotas.deleteFilter(id);
                if (success) {
                  toast.success("Filter deleted");
                } else {
                  toast.error("Error deleting filter");
                }
              }}
              onLoadFilter={(filter) => {
                toast.success(`Filter "${filter.name}" loaded`);
              }}
            />
          </div>
          {/* Colonne droite - Export */}
          <div className="lg:col-span-8 space-y-4">
            {/* Export Panel */}
            <ExportPanel
              hasExtracted={hasExtracted}
              rowCount={5}
              onDownload={handleDownload}
            />
          </div>
        </div>
      </main>
      {/* Modals */}
      <OutlookConnectModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onConnect={handleOutlookConnect}
        isConnecting={isConnectingOutlook}
      />
      <SaveFilterModal
        open={showSaveFilterModal}
        onOpenChange={setShowSaveFilterModal}
        onSave={handleSaveFilter}
        canSave={quotas.canSaveFilter}
        savedFiltersCount={quotas.savedFiltersCount}
        maxFilters={quotas.limits.maxFilters}
        nextPlanName={quotas.nextPlanName}
        blockedMessage={quotas.getFilterBlockedMessage()}
      />
    </div>
  );
}