import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-8">
            Conditions Générales d'Utilisation
          </h1>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                1. Objet
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes conditions régissent l'utilisation du service
                Inbox2Excel.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                2. Accès au service
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                L'accès au service est réservé aux utilisateurs disposant d'un
                compte actif et d'un abonnement valide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                3. Utilisation autorisée
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                L'utilisateur s'engage à :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Utiliser le service uniquement pour ses propres besoins</li>
                <li>Respecter la législation en vigueur</li>
                <li>Disposer des droits nécessaires sur les emails traités</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                4. Abonnement
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Les abonnements sont mensuels</li>
                <li>Le paiement est géré via Stripe</li>
                <li>
                  L'utilisateur peut modifier ou annuler son abonnement à tout
                  moment
                </li>
                <li>L'annulation prend effet à la fin de la période en cours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                5. Responsabilité
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Inbox2Excel fournit le service "en l'état" et ne peut être tenu
                responsable d'une mauvaise utilisation des données extraites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                6. Résiliation
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                En cas de non-respect des conditions, l'accès au service peut
                être suspendu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                7. Droit applicable
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes conditions sont soumises au droit français.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;