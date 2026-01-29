'use client';

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Updated limits based on your provided package details
const DEFAULT_LIMITS = {
  STARTER: { extractionsPerMonth: 1500, maxFilters: 2, maxFieldsPerFilter: 2 },
  PRO: { extractionsPerMonth: 7500, maxFilters: 5, maxFieldsPerFilter: 5 },
  PRIME: { extractionsPerMonth: 25000, maxFilters: 10, maxFieldsPerFilter: 10 },
  FREE: { extractionsPerMonth: 0, maxFilters: 0, maxFieldsPerFilter: 0 },
};

const PLAN_NAMES = {
  STARTER: "Starter",
  PRO: "Pro",
  PRIME: "Prime",
  FREE: "Free Plan",
};

const PLAN_PRICES = {
  STARTER: 14.99,
  PRO: 29.99,
  PRIME: 59.99,
  FREE: 0,
};

const NEXT_PLAN = {
  STARTER: "PRO",
  PRO: "PRIME",
  PRIME: null,
};

export function useSubscriptionQuotas() {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);

  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/subscription/status");
      
      if (!response.ok) throw new Error("Failed to fetch subscription");
      
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error("Subscription Fetch Error:", err);
      // Fallback: Agar API fail ho jaye to session ka data use karein
      if (session?.user) {
        setSubscriptionData({
          plan: session.user.plan,
          paymentStatus: session.user.paymentStatus,
          limits: session.user.limits,
          usage: { extractionsCount: session.user.extractionsUsed }
        });
      }
      setError("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const fetchSavedFilters = useCallback(async () => {
    try {
      const response = await fetch("/api/filters");
      if (!response.ok) throw new Error("Failed to fetch filters");
      
      const data = await response.json();
      const formattedFilters = (data.filters || []).map((f) => ({
        id: f._id || f.id,
        name: f.name,
        createdAt: new Date(f.createdAt),
        data: f.data || {},
      }));
      setSavedFilters(formattedFilters);
    } catch (err) {
      console.error("Filter Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSubscription();
      fetchSavedFilters();
    }
  }, [session, fetchSubscription, fetchSavedFilters]);

  // Priority: 1. API Data, 2. Session Data, 3. Default (FREE)
  const plan = (subscriptionData?.plan || session?.user?.plan || "FREE").toUpperCase();
  const paymentStatus = subscriptionData?.paymentStatus || session?.user?.paymentStatus || "pending";
  const isSubscribed = paymentStatus === "active";
  
  const limits = session?.user?.limits ;
  
  const extractionsUsedThisMonth = subscriptionData?.usage?.extractionsCount || session?.user?.extractionsUsed || 0;
  const savedFiltersCount = savedFilters.length;
  
  const planName = PLAN_NAMES[plan] || plan;
  const planPrice = PLAN_PRICES[plan] || 0;
  const nextPlan = NEXT_PLAN[plan];
  const nextPlanName = nextPlan ? PLAN_NAMES[nextPlan] : null;

  const canExtract = isSubscribed && extractionsUsedThisMonth < limits.extractions;
  const isMonthlyLimitReached = extractionsUsedThisMonth >= limits?.extractions;
  
  const canSaveFilter = savedFiltersCount < limits?.filters;
  const filtersRemaining = Math.max(0, limits?.filters - savedFiltersCount);

  const consumeExtraction = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/consume", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setSubscriptionData(prev => ({
          ...prev,
          usage: { ...prev?.usage, extractionsCount: data.newCount }
        }));
        // Update NextAuth session to keep it in sync
        updateSession(); 
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [updateSession]);

  const saveFilter = useCallback(async (name, filterData) => {
    if (!canSaveFilter) {
      toast.error(`Limite atteinte ! Passez au plan ${nextPlanName || 'supérieur'} pour enregistrer plus de filtres.`);
      return false;
    }

    try {
      const response = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...filterData }),
      });

      if (!response.ok) throw new Error("Failed to save filter");
      
      const newFilter = await response.json();
      setSavedFilters(prev => [{
        id: newFilter.id,
        name: newFilter.name,
        createdAt: new Date(),
        data: filterData,
      }, ...prev]);
      
      toast.success("Filtre enregistré !");
      return true;
    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  }, [canSaveFilter, nextPlanName]);

  const deleteFilter = useCallback(async (filterId) => {
    try {
      const response = await fetch(`/api/filters/${filterId}`, { method: "DELETE" });
      if (response.ok) {
        setSavedFilters(prev => prev.filter(f => f.id !== filterId));
        toast.success("Filtre supprimé");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Delete Error:", err);
      return false;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/portal", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return { success: true };
      }
      return { success: false, error: "Portail indisponible" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading: isLoading && !session,
    error,
    isSubscribed,
    paymentStatus,
    plan,
    planName,
    planPrice,
    nextPlan,
    nextPlanName,
    limits,
    extractionsUsedThisMonth,
    canExtract,
    isMonthlyLimitReached,
    savedFiltersCount,
    savedFilters,
    canSaveFilter,
    filtersRemaining,
    maxFieldsPerFilter: limits?.fields,
    consumeExtraction,
    saveFilter,
    deleteFilter,
    openCustomerPortal,
    refreshSubscription: fetchSubscription,
  };
}