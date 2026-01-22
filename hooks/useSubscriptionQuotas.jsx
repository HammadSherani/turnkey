'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // --- Helper to get headers with Token ---
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) alert("No access token found");
    return {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    };
  };

  // 1. Fetch subscription status (Updated with Headers)
  // 1. Fetch subscription status (CLEANED UP)
  const fetchSubscription = useCallback(async () => {
    try {
      setError(null);

      // The SDK automatically grabs the session token and adds it to the headers.
      // Do NOT pass a second argument unless it's the 'body' of your POST request.
      const { data, error: fnError } = await supabase.functions.invoke("check-subscription");

      if (fnError) {
        // If fnError.status is 401, the user is likely not logged in
        console.error("Function Error:", fnError);
        setError("Session expirée ou non autorisée");
        return;
      }

      setSubscriptionData(data);
    } catch (err) {
      console.error("Connection Error:", err);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch saved filters from database
  const fetchSavedFilters = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("saved_filters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching filters:", error);
        return;
      }
      const filters = (data || []).map((f) => ({
        id: f.id,
        name: f.name,
        createdAt: new Date(f.created_at),
        data: {
          subject: f.subject_filter || "",
          sender: f.sender_filter || "",
          startDate: f.start_date ? new Date(f.start_date) : undefined,
          endDate: f.end_date ? new Date(f.end_date) : undefined,
          extractionRules: Array.isArray(f.extraction_rules) ? f.extraction_rules : [],
        },
      }));
      setSavedFilters(filters);
    } catch (err) {
      console.error("Filter fetch error:", err);
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchSubscription();
    // fetchSavedFilters();
    const interval = setInterval(() => {
      fetchSubscription();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchSubscription, fetchSavedFilters]);

  // Derived values
  const plan = subscriptionData?.plan || null;
  const isSubscribed = subscriptionData?.subscribed || false;
  const limits = subscriptionData?.limits || (plan ? DEFAULT_LIMITS[plan] : DEFAULT_LIMITS.starter);
  const subscriptionEnd = subscriptionData?.subscription_end;
  const extractionsUsedThisMonth = subscriptionData?.usage?.extractionsUsedThisMonth || 0;
  const savedFiltersCount = savedFilters.length;
  const planName = plan ? PLAN_NAMES[plan] : null;
  const planPrice = plan ? PLAN_PRICES[plan] : null;
  const nextPlan = plan ? NEXT_PLAN[plan] : "starter";
  const nextPlanName = nextPlan ? PLAN_NAMES[nextPlan] : null;
  const nextPlanPrice = nextPlan ? PLAN_PRICES[nextPlan] : null;

  const canExtract = isSubscribed && extractionsUsedThisMonth < limits.extractionsPerMonth;
  const isMonthlyLimitReached = extractionsUsedThisMonth >= limits.extractionsPerMonth;
  const extractionsRemainingThisMonth = Math.max(0, limits.extractionsPerMonth - extractionsUsedThisMonth);
  const monthlyUsagePercent = Math.min(100, (extractionsUsedThisMonth / limits.extractionsPerMonth) * 100);

  const canSaveFilter = isSubscribed && savedFiltersCount < limits.maxFilters;
  const filtersRemaining = Math.max(0, limits.maxFilters - savedFiltersCount);
  const filtersUsagePercent = (savedFiltersCount / limits.maxFilters) * 100;

  const canAddField = (currentFieldsCount) => currentFieldsCount < limits.maxFieldsPerFilter;
  const fieldsRemaining = (currentFieldsCount) => Math.max(0, limits.maxFieldsPerFilter - currentFieldsCount);

  // 3. Consume extraction via backend (Updated with Headers)
  const consumeExtraction = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const { data, error: fnError } = await supabase.functions.invoke("consume-extraction", headers);

      if (fnError) {
        return { success: false, error: fnError.message };
      }
      if (!data.success) {
        return { success: false, error: data.error };
      }

      setSubscriptionData(prev => prev ? {
        ...prev,
        usage: {
          ...prev.usage,
          extractionsUsedThisMonth: data.usage.extractionsUsedThisMonth,
        }
      } : null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // 4. Save filter to database
  const saveFilter = useCallback(async (name, data) => {
    if (!canSaveFilter) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const insertData = {
        user_id: user.id,
        name,
        subject_filter: data.subject || null,
        sender_filter: data.sender || null,
        start_date: data.startDate ? data.startDate.toISOString().split("T")[0] : null,
        end_date: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
        extraction_rules: data.extractionRules,
      };
      const { data: newFilter, error } = await supabase
        .from("saved_filters")
        .insert(insertData)
        .select()
        .single();
      if (error) {
        console.error("Error saving filter:", error);
        return false;
      }
      setSavedFilters(prev => [{
        id: newFilter.id,
        name: newFilter.name,
        createdAt: new Date(newFilter.created_at),
        data,
      }, ...prev]);
      return true;
    } catch (err) {
      console.error("Save filter error:", err);
      return false;
    }
  }, [canSaveFilter]);

  // 5. Delete filter from database
  const deleteFilter = useCallback(async (filterId) => {
    try {
      const { error } = await supabase
        .from("saved_filters")
        .delete()
        .eq("id", filterId);
      if (error) {
        console.error("Error deleting filter:", error);
        return false;
      }
      setSavedFilters(prev => prev.filter(f => f.id !== filterId));
      return true;
    } catch (err) {
      console.error("Delete filter error:", err);
      return false;
    }
  }, []);

  // 6. Open customer portal (Updated with Headers)
  const openCustomerPortal = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const { data, error: fnError } = await supabase.functions.invoke("customer-portal", headers);

      if (fnError) {
        return { success: false, error: fnError.message };
      }
      if (data.error) {
        return { success: false, error: data.error };
      }
      if (data.url) {
        window.open(data.url, "_blank");
        return { success: true };
      }
      return { success: false, error: "URL non disponible" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // Message helpers
  const getExtractionBlockedMessage = () => {
    if (!isSubscribed) return "Vous n'avez pas d'abonnement actif.";
    if (isMonthlyLimitReached) return "Vous avez atteint votre quota mensuel d'extractions.";
    return null;
  };
  const getFilterBlockedMessage = () => {
    if (!isSubscribed) return "Vous n'avez pas d'abonnement actif.";
    if (!canSaveFilter) return "Limite de filtres atteinte pour votre abonnement.";
    return null;
  };
  const getFieldBlockedMessage = (currentFieldsCount) => {
    if (!canAddField(currentFieldsCount)) {
      return `Votre abonnement autorise jusqu'à ${limits.maxFieldsPerFilter} champs par filtre.`;
    }
    return null;
  };

  return {
    isLoading,
    error,
    isSubscribed,
    plan,
    planName,
    planPrice,
    nextPlan,
    nextPlanName,
    nextPlanPrice,
    limits,
    subscriptionEnd,
    extractionsUsedThisMonth,
    extractionsRemainingThisMonth,
    monthlyUsagePercent,
    canExtract,
    isMonthlyLimitReached,
    savedFiltersCount,
    savedFilters,
    canSaveFilter,
    filtersRemaining,
    filtersUsagePercent,
    maxFieldsPerFilter: limits.maxFieldsPerFilter,
    canAddField,
    fieldsRemaining,
    consumeExtraction,
    saveFilter,
    deleteFilter,
    openCustomerPortal,
    refreshSubscription: fetchSubscription,
    getExtractionBlockedMessage,
    getFilterBlockedMessage,
    getFieldBlockedMessage,
  };
}