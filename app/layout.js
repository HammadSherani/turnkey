"use client";  

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react"; 
import './globals.css';

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
};

function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <SessionProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

export default Providers;