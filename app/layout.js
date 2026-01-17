"use client";  // Client boundary safe

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import './globals.css';

// Default query options (optional—customize if needed)
const queryClientOptions = {  // Yeh name consistent rakha
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 mins cache
    },
  },
};

function Providers({ children }) {
  // Create fresh QueryClient inside Client Component
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));  // Fixed: queryClientOptions!

  return (
    <html lang="en">
      <body
        className={`bg-background text-foreground antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

export default Providers;