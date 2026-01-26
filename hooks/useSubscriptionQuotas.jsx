'use client';

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const DEFAULT_LIMITS = {
  starter: { extractionsPerMonth: 500, maxFilters: 2, maxFieldsPerFilter: 2 },
  pro: { extractionsPerMonth: 2500, maxFilters: 5, maxFieldsPerFilter: 5 },
  prime: { extractionsPerMonth: 10000, maxFilters: 10, maxFieldsPerFilter: 10 },
};

const PLAN_NAMES = {
  starter: "Starter",
  pro: "Pro",
  prime: "Prime",
};

const PLAN_PRICES = {
  starter: 20,
  pro: 40,
  prime: 70,
};

const NEXT_PLAN = {
  starter: "pro",
  pro: "prime",
  prime: null,
};

export function useSubscriptionQuotas() {
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
      setError("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSavedFilters = useCallback(async () => {
    try {
      const response = await fetch("/api/filters");
      if (!response.ok) throw new Error("Failed to fetch filters");
      
      const data = await response.json();
      
      const formattedFilters = (data.filters || []).map((f) => ({
        id: f._id || f.id,
        name: f.name,
        createdAt: new Date(f.createdAt),
        data: {
          subject: f.subject || "",
          sender: f.sender || "",
          startDate: f.startDate ? new Date(f.startDate) : undefined,
          endDate: f.endDate ? new Date(f.endDate) : undefined,
          extractionRules: f.extractionRules || [],
        },
      }));
      setSavedFilters(formattedFilters);
    } catch (err) {
      console.error("Filter Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchSavedFilters();
  }, [fetchSubscription, fetchSavedFilters]);

  const plan = subscriptionData?.plan || "starter";
  const isSubscribed = subscriptionData?.isSubscribed || false;
  const limits = subscriptionData?.limits || DEFAULT_LIMITS[plan];
  
  const extractionsUsedThisMonth = subscriptionData?.usage?.extractionsCount || 0;
  const savedFiltersCount = savedFilters.length;
  
  const planName = PLAN_NAMES[plan];
  const planPrice = PLAN_PRICES[plan];
  const nextPlan = NEXT_PLAN[plan];
  const nextPlanName = nextPlan ? PLAN_NAMES[nextPlan] : null;

  const canExtract = isSubscribed && extractionsUsedThisMonth < limits.extractionsPerMonth;
  const isMonthlyLimitReached = extractionsUsedThisMonth >= limits.extractionsPerMonth;
  
  const canSaveFilter = savedFiltersCount < limits.maxFilters;
  const filtersRemaining = Math.max(0, limits.maxFilters - savedFiltersCount);

  const consumeExtraction = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/consume", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setSubscriptionData(prev => ({
          ...prev,
          usage: {
            ...prev.usage,
            extractionsCount: data.newCount
          }
        }));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const saveFilter = useCallback(async (name, filterData) => {
    if (!canSaveFilter) {
      toast.error("Limit reached! Upgrade your plan to save more filters.");
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
      
      toast.success("Filter saved successfully!");
      return true;
    } catch (err) {
      console.error("Save Filter Error:", err);
      return false;
    }
  }, [canSaveFilter]);

  const deleteFilter = useCallback(async (filterId) => {
    try {
      const response = await fetch(`/api/filters/${filterId}`, { method: "DELETE" });
      
      if (response.ok) {
        setSavedFilters(prev => prev.filter(f => f.id !== filterId));
        toast.success("Filter deleted");
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
      return { success: false, error: "Portal unavailable" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    error,
    isSubscribed,
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
    maxFieldsPerFilter: limits.maxFieldsPerFilter,
    consumeExtraction,
    saveFilter,
    deleteFilter,
    openCustomerPortal,
    refreshSubscription: fetchSubscription,
  };
}