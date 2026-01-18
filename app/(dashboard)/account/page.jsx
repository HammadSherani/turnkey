"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Lock, CreditCard, Calendar, CheckCircle, AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const PLAN_LABELS = {
  starter: "Starter",
  pro: "Pro",
  prime: "Prime",
};

const STATUS_CONFIG = {
  active: { label: "Actif", variant: "default", icon: CheckCircle },
  cancelled: { label: "Annulé", variant: "destructive", icon: AlertTriangle },
  expiring: { label: "Expire bientôt", variant: "secondary", icon: AlertTriangle },
};

const Account = () => {
  const { toast } = useToast();
  const router = useRouter();
 
  // Mock user data - will be replaced with real data from Supabase
  const [userData] = useState({
    email: "utilisateur@exemple.com",
    plan: "pro",
    renewalDate: "15 février 2026",
    status: "active",
  });
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handlePasswordChange = async (e) => {
    e.preventDefault();
   
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
   
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
   
    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été mis à jour avec succès.",
    });
   
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordForm(false);
    setIsSubmitting(false);
  };
  const handleManageSubscription = () => {
    // Will open Stripe Customer Portal
    toast({
      title: "Redirection vers Stripe",
      description: "Ouverture du portail de gestion...",
    });
    // window.open("STRIPE_CUSTOMER_PORTAL_URL", "_blank");
  };
  const handleCancelSubscription = async () => {
    // Will call Stripe API to cancel subscription
    toast({
      title: "Abonnement annulé",
      description: "Votre abonnement restera actif jusqu'à la fin de la période en cours.",
    });
  };
  const handleDeleteAccount = async () => {
    // Will call API to delete account
    toast({
      title: "Compte supprimé",
      description: "Votre compte a été supprimé avec succès.",
    });
    router.push("/");
  };
  const statusConfig = STATUS_CONFIG[userData.status];
  const StatusIcon = statusConfig.icon;
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mon compte</h1>
              <p className="text-sm text-muted-foreground">
                Gérez vos informations et votre abonnement
              </p>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Section 1: Informations du compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Informations du compte
            </CardTitle>
            <CardDescription>
              Vos informations de connexion et de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Cette adresse est utilisée pour la connexion et la facturation.
              </p>
            </div>
            <Separator />
            {/* Password */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Mot de passe
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Modifiez votre mot de passe de connexion
                  </p>
                </div>
                {!showPasswordForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Modifier le mot de passe
                  </Button>
                )}
              </div>
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 caractères
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Section 2: Abonnement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Détails de votre abonnement actuel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Details */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Plan actuel</p>
                <p className="text-lg font-semibold">{PLAN_LABELS[userData.plan]}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Prochain renouvellement
                </p>
                <p className="text-lg font-semibold">{userData.renewalDate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge variant={statusConfig.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <Separator />
            {/* Subscription Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleManageSubscription}
                className="w-full sm:w-auto"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Gérer mon abonnement
              </Button>
              <p className="text-xs text-muted-foreground">
                Accédez au portail Stripe pour modifier votre plan, mettre à jour votre moyen de paiement ou consulter vos factures.
              </p>
            </div>
            <Separator />
            {/* Cancel Subscription */}
            <div className="space-y-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    Annuler mon abonnement
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr de vouloir annuler votre abonnement ?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Votre abonnement restera actif jusqu'à la fin de la période en cours ({userData.renewalDate}).
                      </p>
                      <p>
                        Après cette date, vous perdrez l'accès aux fonctionnalités premium.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Garder mon abonnement</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmer l'annulation
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground">
                Vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période en cours.
              </p>
            </div>
            <Separator />
            {/* Delete Account */}
            <div className="space-y-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer votre compte ?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                      </p>
                      <p>
                        Vous perdrez l'accès à tous vos filtres sauvegardés et à votre historique d'extractions.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground">
                Attention : cette action est définitive et irréversible.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Account;