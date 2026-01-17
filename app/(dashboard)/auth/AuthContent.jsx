"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, ArrowLeft, Loader2, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Password validation rules
const passwordRules = [
  { id: "length", label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { id: "uppercase", label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "Une lettre minuscule", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Un caractère spécial (!@#$%...)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const isPasswordStrong = (password) => passwordRules.every(rule => rule.test(password));

// Email validation
const validateEmail = (email) => {
  if (!email) return { isValid: false };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Format d'email invalide" };
  }
  
  // Check for common typos in popular domains
  const commonTypos = {
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gmil.com": "gmail.com",
    "gmail.fr": "gmail.com",
    "hotmal.com": "hotmail.com",
    "hotmial.com": "hotmail.com",
    "outloo.com": "outlook.com",
    "outlok.com": "outlook.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
  };
  
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && commonTypos[domain]) {
    return { isValid: false, error: `Vouliez-vous dire @${commonTypos[domain]} ?` };
  }
  
  // Check minimum domain requirements
  const domainParts = domain?.split(".");
  if (!domainParts || domainParts.length < 2 || domainParts.some(p => p.length < 2)) {
    return { isValid: false, error: "Le domaine de l'email semble invalide" };
  }
  
  return { isValid: true };
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "20",
    features: [
      "500 extractions / mois",
      "2 filtres sauvegardés",
      "2 champs de données par filtre",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "40",
    features: [
      "2 500 extractions / mois",
      "5 filtres sauvegardés",
      "5 champs de données par filtre",
    ],
    popular: true,
  },
  {
    id: "prime",
    name: "Prime",
    price: "70",
    features: [
      "10 000 extractions / mois",
      "10 filtres sauvegardés",
      "10 champs de données par filtre",
    ],
    popular: false,
  },
];

// Separate component that uses useSearchParams
function AuthContent() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams?.get("plan");
  const modeFromUrl = searchParams?.get("mode");
  
  const [selectedPlan, setSelectedPlan] = useState(
    modeFromUrl === "login" ? "login" : planFromUrl
  );
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Validate email on change
  const handleEmailChange = (value) => {
    setEmail(value);
    if (value) {
      const validation = validateEmail(value);
      setEmailError(validation.error || null);
    } else {
      setEmailError(null);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Email invalide",
        description: emailValidation.error || "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordStrong(password)) {
      toast({
        title: "Mot de passe trop faible",
        description: "Veuillez respecter tous les critères de sécurité",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store credentials temporarily for after payment
      sessionStorage.setItem("pendingSignup", JSON.stringify({
        email,
        password,
        planId: selectedPlan,
      }));

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: selectedPlan, email },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Open Stripe Checkout
      window.open(data.url, "_blank");
      setIsLoading(false);
      
      toast({
        title: "Paiement en cours",
        description: "Complétez le paiement dans l'onglet Stripe pour finaliser votre inscription",
      });
    } catch (err) {
      console.error("Checkout error:", err);
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de la création du paiement",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur Inbox2Excel",
      });
      router.push("/dashboard");
    }
  };

  // Step 1: Plan selection
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choisissez votre plan
            </h1>
            <p className="text-lg text-muted-foreground">
              Sélectionnez le plan qui correspond à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl bg-card p-8 transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
                  plan.popular
                    ? "border-2 border-accent shadow-lg ring-1 ring-accent/20"
                    : "border border-border hover:border-accent/40 hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wide">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-6">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-foreground">
                      {plan.price}€
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>par utilisateur / mois</span>
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

                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground" 
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  size="lg"
                >
                  Choisir {plan.name}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => setSelectedPlan("login")}
                className="text-accent hover:underline font-medium"
              >
                Connectez-vous
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login form
  if (selectedPlan === "login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Inbox2Excel</CardTitle>
              <CardDescription>
                Connectez-vous à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={email.length > 0 ? (emailError ? "border-destructive focus-visible:ring-destructive" : validateEmail(email).isValid ? "border-green-500 focus-visible:ring-green-500" : "") : ""}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
              
              <div className="text-center pt-4 mt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Vous n'avez pas de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="text-accent hover:underline font-medium"
                  >
                    Créez-en un
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Signup form before payment
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => setSelectedPlan(null)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Changer de plan
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Créez votre compte</CardTitle>
            {selectedPlanData && (
              <CardDescription>
                Plan sélectionné : <span className="font-semibold text-accent">{selectedPlanData.name} - {selectedPlanData.price}€/mois</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className={email.length > 0 ? (emailError ? "border-destructive focus-visible:ring-destructive" : validateEmail(email).isValid ? "border-green-500 focus-visible:ring-green-500" : "") : ""}
                />
                {emailError && (
                  <p className="text-xs text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`pr-10 ${password.length > 0 ? (isPasswordStrong(password) ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    {passwordRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2 text-xs">
                        {rule.test(password) ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-destructive" />
                        )}
                        <span className={rule.test(password) ? "text-green-600" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`pr-10 ${confirmPassword.length > 0 ? (password === confirmPassword && isPasswordStrong(password) ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p>Après validation, vous serez redirigé vers la page de paiement sécurisée Stripe. Votre compte sera créé uniquement après confirmation du paiement.</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirection vers le paiement...
                  </>
                ) : (
                  "Continuer vers le paiement"
                )}
              </Button>
            </form>
            
            <div className="text-center pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("login")}
                  className="text-accent hover:underline font-medium"
                >
                  Connectez-vous
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default AuthContent