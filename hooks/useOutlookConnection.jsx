'use client';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useOutlookConnection() {
  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState({
    connected: false,
    email: null,
    displayName: null,
  });
  const [error, setError] = useState(null);
  // Check if user is connected via Azure provider
  const checkConnection = useCallback(async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
     
      if (!session) {
        setConnection({ connected: false, email: null, displayName: null });
        return;
      }
      // Check if the user authenticated via Azure
      const provider = session.user.app_metadata?.provider;
      const providers = session.user.app_metadata?.providers || [];
     
      const isAzureConnected = provider === "azure" || providers.includes("azure");
     
      console.log("[Outlook] Session check:", {
        provider,
        providers,
        isAzureConnected,
        email: session.user.email
      });
     
      if (isAzureConnected) {
        setConnection({
          connected: true,
          email: session.user.email || null,
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
        });
      } else {
        setConnection({ connected: false, email: null, displayName: null });
      }
    } catch (err) {
      console.error("[Outlook] Error checking connection:", err);
      setError("Erreur lors de la vérification de la connexion");
    } finally {
      setIsLoading(false);
    }
  }, []);
  // Initial check + listen for auth changes
  useEffect(() => {
    checkConnection();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Outlook] Auth state changed:", event);
     
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkConnection();
      } else if (event === "SIGNED_OUT") {
        setConnection({ connected: false, email: null, displayName: null });
      }
    });
    return () => subscription.unsubscribe();
  }, [checkConnection]);
  // Connect to Outlook via Supabase Auth Azure provider
  const connect = useCallback(async () => {
    try {
      setError(null);
      console.log("[Outlook] Starting Azure OAuth flow...");
     
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "openid profile email offline_access Mail.Read User.Read",
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
     
      if (authError) {
        console.error("[Outlook] OAuth error:", authError);
       
        // Check for specific error cases
        if (authError.message.includes("provider is not enabled")) {
          return {
            success: false,
            error: "Le provider Azure n'est pas activé. Veuillez contacter le support."
          };
        }
       
        return { success: false, error: authError.message };
      }
      console.log("[Outlook] OAuth initiated, redirecting to Microsoft...", data);
      // User will be redirected to Microsoft login
      return { success: true };
    } catch (err) {
      console.error("[Outlook] Unexpected error:", err);
      return { success: false, error: err.message };
    }
  }, []);
  // Disconnect from Outlook (sign out from Supabase)
  const disconnect = useCallback(async () => {
    try {
      console.log("[Outlook] Signing out...");
      const { error: signOutError } = await supabase.auth.signOut();
     
      if (signOutError) {
        console.error("[Outlook] Sign out error:", signOutError);
        return { success: false, error: signOutError.message };
      }
      setConnection({
        connected: false,
        email: null,
        displayName: null,
      });
      console.log("[Outlook] Successfully signed out");
      return { success: true };
    } catch (err) {
      console.error("[Outlook] Unexpected sign out error:", err);
      return { success: false, error: err.message };
    }
  }, []);
  return {
    isLoading,
    error,
    isConnected: connection.connected,
    isExpired: false, // Supabase handles token refresh automatically
    email: connection.email,
    displayName: connection.displayName,
    connectedAt: null,
    connect,
    disconnect,
    refresh: checkConnection,
  };
}