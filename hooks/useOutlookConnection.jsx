import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export function useOutlookConnection() {
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [connection, setConnection] = useState({
    connected: false,
    email: null,
    displayName: null,
    connectedAt: null,
  });
  const [error, setError] = useState(null);

  // 🔍 Check Outlook connection from backend
  const checkConnection = useCallback(async () => {
    try {
      setError(null);

      if (!session?.user) {
        setConnection({
          connected: false,
          email: null,
          displayName: null,
          connectedAt: null,
        });
        return;
      }

      const res = await fetch("/api/outlook/status");
      if (!res.ok) throw new Error("Failed to fetch Outlook status");

      const data = await res.json();

      setConnection({
        connected: data.connected,
        email: data?.data?.email || null,
        displayName: data?.data?.displayName || null,
        connectedAt: data?.data?.connectedAt || null,
      });
    } catch (err) {
      console.error("[Outlook] Status check error:", err);
      setError("Failed to check Outlook connection");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Initial load + session change
  useEffect(() => {
    if (status !== "loading") {
      checkConnection();
    }
  }, [status, checkConnection]);

  // 🔗 Start Outlook OAuth (custom flow)
  const connect = useCallback(() => {
    try {
      setError(null);

      // Backend route jo Microsoft OAuth start kare
      window.location.href = "/api/outlook/connect";

      return { success: true };
    } catch (err) {
      console.error("[Outlook] Connect error:", err);
      return { success: false, error: err.message };
    }
  }, []);

  // ❌ Disconnect Outlook
  const disconnect = useCallback(async () => {
    try {
      setError(null);

      const res = await fetch("/api/outlook/disconnect", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to disconnect Outlook");

      setConnection({
        connected: false,
        email: null,
        displayName: null,
        connectedAt: null,
      });

      return { success: true };
    } catch (err) {
      console.error("[Outlook] Disconnect error:", err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    isLoading,
    error,
    isConnected: connection.connected,
    isExpired: false, // tum refresh-token logic baad me laga sakte ho
    email: connection.email,
    displayName: connection.displayName,
    connectedAt: connection.connectedAt,
    connect,
    disconnect,
    refresh: checkConnection,
  };
}
