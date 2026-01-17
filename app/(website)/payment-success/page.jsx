"use client";


import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PLAN_NAMES = {
  starter: "Starter",
  pro: "Pro",
  prime: "Prime",
};

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [planId, setPlanId] = useState("starter");

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError("Session ID manquante");
        setStatus("error");
        return;
      }

      try {
        // 1. Verify payment with Supabase Function (or Stripe)
        const { data: sessionData, error: sessionError } = await supabase.functions.invoke("get-checkout-session", {
          body: { sessionId },
        });

        if (sessionError) throw sessionError;
        if (sessionData.error) throw new Error(sessionData.error);

        setPlanId(sessionData.planId || "starter");

        // 2. Get pending signup data from sessionStorage
        const pendingSignupStr = sessionStorage.getItem("pendingSignup");
        if (!pendingSignupStr) {
          throw new Error("Données d'inscription non trouvées. Veuillez recommencer le processus d'inscription.");
        }

        const pendingSignup = JSON.parse(pendingSignupStr);

        // Verify email matches
        if (pendingSignup.email !== sessionData.email) {
          throw new Error("L'email ne correspond pas. Veuillez recommencer le processus d'inscription.");
        }

        setStatus("creating");

        // 3. Create the user account
        const { error: signUpError } = await supabase.auth.signUp({
          email: pendingSignup.email,
          password: pendingSignup.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              plan: sessionData.planId,
              stripe_customer_id: sessionData.customerId,
              stripe_subscription_id: sessionData.subscriptionId,
            },
          },
        });

        if (signUpError) throw signUpError;

        // 4. Clear pending signup data
        sessionStorage.removeItem("pendingSignup");

        setStatus("success");

        toast({
          title: "Compte créé avec succès !",
          description: "Connectez-vous pour accéder à votre tableau de bord",
        });

        // Redirect to login page after short delay
        setTimeout(() => {
          router.push("/auth?mode=login");
        }, 2000);
      } catch (err) {
        console.error("Error processing payment:", err);
        setError(err.message || "Erreur lors de la création du compte");
        setStatus("error");
      }
    };

    processPayment();
  }, [sessionId, router, toast]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (status === "creating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Création de votre compte...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl text-destructive">Erreur</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/auth")}>
              Réessayer l'inscription
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Bienvenue sur Inbox2Excel !</CardTitle>
          <CardDescription>
            Votre compte a été créé avec succès.
            <br />
            Plan {PLAN_NAMES[planId]} activé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Redirection vers la page de connexion...
          </p>
          <Button className="w-full" onClick={() => router.push("/auth?mode=login")}>
            Se connecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}