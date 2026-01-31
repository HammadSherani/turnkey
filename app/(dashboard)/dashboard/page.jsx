"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, TrendingUp, AlertTriangle, RefreshCw, CreditCard } from "lucide-react";
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
import { plans } from "@/constants/data";



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

  const quotas = useSubscriptionQuotas();
  const outlook = useOutlookConnection();

  console.log('quotas', quotas);
  

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth?mode=login");
  };

  const handleDisconnect = async () => {
    if (!confirm("Voulez-vous vraiment déconnecter Outlook ?")) return;
    try {
      const response = await fetch("/api/outlook/logout", { method: "POST" });
      if (response.ok) {
        toast.success("Outlook déconnecté");
        window.location.reload();
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

    if (!quotas.canExtract) {
      toast.error("Limite d'extraction atteinte !");
      return;
    }

    setIsExtracting(true);

    // console.log("payload", payload);
    // return;
    
    try {
      const response = await fetch("/api/outlook/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to extract");

      setExtractedData(result.results || []);
      setHasExtracted(true);
      toast.success(`${result.results?.length || 0} emails extraits.`);
      await quotas.consumeExtraction();
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'extraction");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleOpenSaveModal = (data) => {
    if (!quotas.canSaveFilter) {
      toast.error("Limite de filtres atteinte.");
      return;
    }
    setPendingFilterData(data);
    setShowSaveFilterModal(true);
  };

  const handleSaveFilter = async (name) => {
    if (!pendingFilterData) return false;
    const success = await quotas.saveFilter(name, pendingFilterData);
    if (success) setPendingFilterData(null);
    return success;
  };

  const handleOutlookConnect = async () => {
    setIsConnectingOutlook(true);
    const result = await outlook.connect();
    if (result && !result.success) {
      setIsConnectingOutlook(false);
      toast.error(result.error || "Error connecting to Outlook");
    }
  };

  const handleManageSubscription = async () => {
    const result = await quotas.openCustomerPortal();
    if (!result.success) router.push("/#pricing");
  };

  // 2. Loading State
  if (status === "loading" || (status === "authenticated" && quotas.isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // 3. Conditional Render: Payment Pending
  // Yahan automatic redirect nahi hoga, sirf UI block hogi with a button
  if (status === "authenticated" && session?.user?.paymentStatus !== "active") {
    const userPlanId = session?.user?.plan?.toLowerCase();
    const selectedPlan = plans.find(p => p.id === userPlanId) || plans[0];

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-border shadow-xl rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8 text-amber-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Paiement Requis</h1>
            <p className="text-muted-foreground">
              Vous avez choisi le plan <span className="font-bold text-foreground">{selectedPlan.name}</span>. 
              Veuillez compléter votre paiement pour activer vos outils d'extraction.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-dashed border-slate-300 text-left">
            <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Inclus dans {selectedPlan.name}:</p>
            <ul className="text-sm space-y-1">
              {selectedPlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-400" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
              onClick={() => window.location.href = `${selectedPlan.stripeUrl}?client_reference_id=${session.user.id}`}
            >
              Compléter le paiement ({selectedPlan.price}€)
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Vérifier
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Quitter
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Dashboard View (Only if Paid)
  const usagePercent = Math.min(100, (quotas.extractionsUsedThisMonth / quotas?.limits?.extractionsPerMonth) * 100);

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
              {outlook.isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-500/10 text-green-600 border border-green-200">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="max-w-[150px] truncate">{outlook.email || "Connecté"}</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowConnectModal(true)} className="gap-2">
                  Connecter Outlook
                </Button>
              )}

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
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">{session?.user?.email}</div>
                  <DropdownMenuItem onClick={() => router.push("/account")}><User className="h-4 w-4 mr-2" /> Mon Compte</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleManageSubscription}><TrendingUp className="h-4 w-4 mr-2" /> Abonnement</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Déconnexion</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={handleDisconnect}><LogOut className="h-4 w-4 mr-2" /> Déconnecter Outlook</DropdownMenuItem>
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
          extractionsLimit={quotas?.limits?.extractionsPerMonth}
          monthlyUsagePercent={usagePercent}
          onUpgrade={handleManageSubscription}
          onRefresh={quotas.refreshSubscription}
        />

        <ExtractionLimitAlert
          isMonthlyLimitReached={quotas.isMonthlyLimitReached}
          monthlyLimit={quotas?.limits?.extractionsPerMonth}
          nextPlanName={quotas.nextPlanName}
          onUpgrade={handleManageSubscription}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <FiltersSidebar
              plan={quotas.plan}
              maxFieldsPerFilter={quotas.maxFieldsPerFilter}
              nextPlanName={quotas.nextPlanName}
              onExtract={handleExtract}
              isExtracting={isExtracting}
              isQuotaReached={!quotas.canExtract}
              onSaveFilter={handleOpenSaveModal}
              canSaveFilter={quotas.canSaveFilter}
              savedFiltersCount={quotas.savedFiltersCount}
              maxFilters={quotas?.limits?.maxFilters}
              savedFilters={quotas.savedFilters}
              onDeleteFilter={(id) => quotas.deleteFilter(id)}
              onLoadFilter={(f) => toast.success(`Filtre ${f.name} chargé`)}
            />
          </div>

          <div className="lg:col-span-8 space-y-4">
            <ExportPanel
              hasExtracted={hasExtracted}
              rowCount={extractedData.length}
              extractedData={extractedData}
            />
          </div>
        </div>
      </main>

      <OutlookConnectModal open={showConnectModal} onOpenChange={setShowConnectModal} onConnect={handleOutlookConnect} isConnecting={isConnectingOutlook} />
      <SaveFilterModal open={showSaveFilterModal} onOpenChange={setShowSaveFilterModal} onSave={handleSaveFilter} canSave={quotas.canSaveFilter} savedFiltersCount={quotas.savedFiltersCount} maxFilters={quotas?.limits?.maxFilters} nextPlanName={quotas?.nextPlanName} />
    </div>
  );
}