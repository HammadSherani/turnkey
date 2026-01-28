"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, TrendingUp } from "lucide-react";
import { useSubscriptionQuotas } from "@/hooks/useSubscriptionQuotas";
import { useOutlookConnection } from "@/hooks/useOutlookConnection";
import FiltersSidebar from "@/components/dashboard/FiltersSidebar";
import ExportPanel from "@/components/dashboard/ExportPanel";
import OutlookConnectModal from "@/components/dashboard/OutlookConnectModal";
import SaveFilterModal from "@/components/dashboard/SaveFilterModal";
import ExtractionLimitAlert from "@/components/dashboard/ExtractionLimitAlert";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
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
  const { data: session, status } = useSession();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [pendingFilterData, setPendingFilterData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [isConnectingOutlook, setIsConnectingOutlook] = useState(false);

  // Hooks
  const quotas = useSubscriptionQuotas();
  const outlook = useOutlookConnection();

  // Check Authentication logic (NextAuth way)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

 const handleLogout = async () => {
  await signOut({ redirect: false });
  router.refresh(); 
};


  const handleDisconnect = async () => {
    if (!confirm("Do you really want to disconnect Outlook?.")) return;


    try {
      const response = await fetch("/api/outlook/logout", {
        method: "POST",
      });

      if (response.ok) {
        alert("Successfully Disconnected!");
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleExtract = async (payload) => {
    if (!outlook.isConnected) {
      setShowConnectModal(true);
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch("/api/outlook/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      console.log("result", result);
      

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract data");
      }
      setExtractedData(result.results || []);
      toast.success(`Success! Extracted data from ${result.results?.length || 0} emails.`);
        setHasExtracted(true);

      // const quotaResult = await quotas.consumeExtraction();

      // if (quotaResult.success) {
      // } else {
      //   toast.error("Quota update failed, but data was fetched.");
      // }

    } catch (error) {
      console.error("Extraction Error:", error);
      toast.error(error.message || "Error during extraction");
    } finally {
      setIsExtracting(false);
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
    // Agar result success hai, user redirect ho chuka hoga
    if (result && !result.success) {
      setIsConnectingOutlook(false);
      toast.error(result.error || "Error connecting to Outlook");
    }
  };

  const handleDownload = () => {
    console.log("Downloading Excel file...");
    toast.success("Download started!");
  };

  const handleManageSubscription = async () => {
    const result = await quotas.openCustomerPortal();
    if (!result.success) {
      if (result.error?.includes("mode test")) {
        toast.info(result.error);
      } else if (result.error?.includes("Aucun abonnement")) {
        router.push("/#pricing");
      } else {
        toast.error(result.error || "Error opening portal");
      }
    }
  };

  // Loading States
  // if (status === "loading" || quotas.isLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="flex flex-col items-center gap-3">
  //         <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //         <p className="text-sm text-muted-foreground">
  //           {status === "loading" ? "Verifying authentication..." : "Loading your subscription..."}
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  // If not subscribed logic
  // if (!quotas.isSubscribed) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="max-w-md text-center space-y-4 p-6">
  //         <h1 className="text-2xl font-bold text-foreground">No Active Subscription</h1>
  //         <p className="text-muted-foreground">
  //           You don't have an active subscription. Choose a plan to start using Inbox2Excel.
  //         </p>
  //         <div className="flex gap-3 justify-center">
  //           <Button onClick={() => router.push("/#pricing")}>
  //             <TrendingUp className="h-4 w-4 mr-2" />
  //             Choose a Plan
  //           </Button>
  //           <Button variant="outline" onClick={handleLogout}>
  //             <LogOut className="h-4 w-4 mr-2" />
  //             Log Out
  //           </Button>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }


  console.log("outlook", outlook);
  console.log("extractedData", extractedData);


  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">I2E</span>
              </div>
              <span className="font-semibold text-lg text-foreground">Inbox2Excel</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Outlook Status */}
              {outlook.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-500/10 text-green-600 border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {outlook.email ? `Outlook Connected` : "Connected"}
                </div>
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

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 p-0 h-8 w-8 rounded-full overflow-hidden border">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="font-medium text-xs text-muted-foreground px-2 py-1.5 opacity-70">
                    {session?.user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/account")}>
                    <User className="h-4 w-4 mr-2" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>

                  <DropdownMenuItem className="text-destructive" onClick={handleDisconnect}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out Outlook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <SubscriptionStatus
          planName={quotas.planName}
          extractionsUsed={quotas.extractionsUsedThisMonth}
          extractionsLimit={quotas.limits.extractionsPerMonth}
          monthlyUsagePercent={quotas.monthlyUsagePercent}
          onUpgrade={handleManageSubscription}
          onRefresh={quotas.refreshSubscription}
        />

        <ExtractionLimitAlert
          isMonthlyLimitReached={quotas.isMonthlyLimitReached}
          monthlyLimit={quotas.limits.extractionsPerMonth}
          nextPlanName={quotas.nextPlanName}
          onUpgrade={handleManageSubscription}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                if (success) toast.success("Filter deleted");
                else toast.error("Error deleting filter");
              }}
              onLoadFilter={(filter) => {
                toast.success(`Filter "${filter.name}" loaded`);
              }}
            />
          </div>

          <div className="lg:col-span-8 space-y-4">
            <ExportPanel
              hasExtracted={hasExtracted}
              rowCount={extractedData.length} // result.results.length
              extractedData={extractedData}  // Poora array
              // onDownload={handleDownloadExcel} // Excel generate karne wala function
            />
          </div>
        </div>
      </main>

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
      // blockedMessage={quotas.getFilterBlockedMessage()}
      />
    </div>
  );
}