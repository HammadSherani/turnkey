"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, ArrowLeft, Loader2, Eye, EyeOff, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation Rules
const passwordRules = [
  { id: "length", label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Une lettre minuscule", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Un caractère spécial (!@#$%...)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const isPasswordStrong = (password) => passwordRules.every(rule => rule.test(password));

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { isValid: false, error: "Format d'email invalide" };
  return { isValid: true };
};

const plans = [
  { id: "starter", name: "Starter", price: "20", features: ["500 extractions / mois", "2 filtres sauvegardés", "2 champs de données par filtre"] },
  { id: "pro", name: "Pro", price: "40", popular: true, features: ["2 500 extractions / mois", "5 filtres sauvegardés", "5 champs de données par filtre"] },
  { id: "prime", name: "Prime", price: "70", features: ["10 000 extractions / mois", "10 filtres sauvegardés", "10 champs de données par filtre"] },
];

export default function AuthPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [currentView, setCurrentView] = useState("planSelection"); // planSelection, login, register
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // Redirect logic handle
  useEffect(() => {
    // Check URL params for mode
    const mode = searchParams?.get("mode");
    const plan = searchParams?.get("plan");
    
    if (mode === "login") {
      setCurrentView("login");
    } else if (plan && ["starter", "pro", "prime"].includes(plan)) {
      setSelectedPlan(plan);
      setCurrentView("register");
    }
    
    // Check for NextAuth Errors (like Google Auth Fail)
    const error = searchParams?.get("error");
    if (error === "OAuthSignin") {
      setCurrentView("login");
      toast({ title: "Auth Error", description: "Google connection failed. Check your settings.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailError(validateEmail(value).error || null);
  };

  // Login Logic
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setIsLoading(false);

    if (res?.error) {
      toast({ title: "Erreur", description: "Email ou mot de passe incorrect", variant: "destructive" });
    } else {
      // router.push("/dashboard");
    }
  };

  // Register + Stripe Payment Logic
  const handleRegister = async (e) => {
    e.preventDefault();
    setStripeError(null);
    
    if (!isPasswordStrong(password) || password !== confirmPassword) {
        toast({ title: "Validation", description: "Veuillez vérifier vos informations", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    try {
      // 1. Register User in MongoDB (Status will be pending)
      const regRes = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ email, password, plan: selectedPlan }),
        headers: { "Content-Type": "application/json" }
      });

      if (!regRes.ok) {
        const errData = await regRes.json();
        throw new Error(errData.message || "Registration failed");
      }

      const regData = await regRes.json();
      console.log("✅ User registered:", regData);

      // 2. Create Stripe Session
      const stripeRes = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ email, planId: selectedPlan }),
        headers: { "Content-Type": "application/json" }
      });

      const stripeData = await stripeRes.json();
      console.log("📦 Stripe response:", stripeData);

      // Check if response has error
      if (!stripeRes.ok || stripeData.error) {
        throw new Error(stripeData.message || stripeData.error || "Stripe session creation failed");
      }
      
      // Check if URL exists
      if (stripeData.url) {
        console.log("🔄 Redirecting to:", stripeData.url);
        
        // Check if it's a mock/dummy session (development mode)
        if (stripeData.mock || stripeData.url.includes("mock=true")) {
          setStripeError({
            type: "warning",
            title: "Mode Développement",
            message: "Vous utilisez des prix fictifs. Configurez Stripe pour les paiements réels.",
            details: stripeData.devNote
          });
          
          // Redirect after showing warning
          setTimeout(() => {
            window.location.href = stripeData.url;
          }, 2000);
        } else {
          // Real Stripe session - redirect immediately
          window.location.href = stripeData.url;
        }
      } else {
        throw new Error("URL de session manquante dans la réponse");
      }

    } catch (err) {
      console.error("❌ Registration/Checkout Error:", err);
      
      setStripeError({
        type: "error",
        title: "Erreur",
        message: err.message,
        details: null
      });
      
      toast({ 
        title: "Erreur", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const handleGoogleAuth = () => signIn("google", { callbackUrl: "/dashboard" });

  // Handle plan selection
  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    setCurrentView("register");
    setStripeError(null);
  };

  // Reset to plan selection
  const resetToPlanSelection = () => {
    setCurrentView("planSelection");
    setSelectedPlan(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEmailError(null);
    setStripeError(null);
  };

  // Switch to login
  const switchToLogin = () => {
    setCurrentView("login");
    setPassword("");
    setConfirmPassword("");
    setStripeError(null);
  };

  // Switch to register (show plan selection first)
  const switchToRegister = () => {
    setCurrentView("planSelection");
    setSelectedPlan(null);
    setPassword("");
    setConfirmPassword("");
    setStripeError(null);
  };

  // 1. Plan Selection View
  if (currentView === "planSelection") {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Choisissez votre plan</h1>
            <p className="text-lg text-muted-foreground">Sélectionnez le plan qui correspond à vos besoins</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} onClick={() => handlePlanSelection(plan.id)}
                className={`relative rounded-2xl bg-card p-8 transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                  plan.popular ? "border-2 border-accent shadow-lg ring-1 ring-accent/20" : "border border-border hover:border-accent/40 hover:shadow-md"
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide">Populaire</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-6">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-foreground">{plan.price}€</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" /> <span>par utilisateur / mois</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.popular ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`} size="lg">
                  Choisir {plan.name}
                </Button>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">Vous avez déjà un compte ?{" "}
              <button type="button" onClick={switchToLogin} className="text-accent hover:underline font-medium">Connectez-vous</button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Login View
  if (currentView === "login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <button onClick={() => router.push("/")} className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Retour
              </button>
            </div>
            <CardTitle className="text-2xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Heureux de vous revoir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isLoading}>
              Continuer avec Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou avec email</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="votre@email.com" required disabled={isLoading}/>
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <Button variant="link" className="w-full text-muted-foreground" onClick={switchToRegister} disabled={isLoading}>
              Pas de compte ? S'inscrire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Registration View (after plan selection)
  if (currentView === "register" && selectedPlan) {
    const currentPlan = plans.find(p => p.id === selectedPlan);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <button onClick={resetToPlanSelection} className="text-sm text-muted-foreground hover:text-foreground flex items-center">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Changer le plan
              </button>
            </div>
            <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              <div className="mt-2 inline-flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full">
                <span className="text-sm font-medium text-accent">Plan {currentPlan?.name}</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm font-semibold text-foreground">{currentPlan?.price}€/mois</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe Error/Warning Alert */}
            {stripeError && (
              <Alert variant={stripeError.type === "warning" ? "default" : "destructive"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">{stripeError.title}</div>
                  <div className="text-sm mt-1">{stripeError.message}</div>
                  {stripeError.details && (
                    <div className="text-xs mt-2 opacity-80">
                      {JSON.stringify(stripeError.details, null, 2)}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isLoading}>
              Continuer avec Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Ou avec email</span></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="votre@email.com" required disabled={isLoading}/>
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading}/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading}/>
                {password && (
                  <div className="grid grid-cols-1 gap-1 mt-2">
                    {passwordRules.map(r => (
                      <div key={r.id} className={`flex items-center gap-2 text-xs ${r.test(password) ? "text-green-500" : "text-gray-400"}`}>
                        {r.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection vers paiement...
                  </>
                ) : (
                  "Continuer vers le paiement"
                )}
              </Button>
            </form>

            <Button variant="link" className="w-full text-muted-foreground" onClick={switchToLogin} disabled={isLoading}>
              Déjà un compte ? Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback
  return null;
}