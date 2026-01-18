import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
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
            Politique de confidentialité
          </h1>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Inbox2Excel attache une grande importance à la protection de vos
                données personnelles. Cette politique explique comment vos
                données sont collectées, utilisées et protégées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                2. Données collectées
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Nous collectons uniquement les données nécessaires au
                fonctionnement du service :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Adresse email</li>
                <li>Informations de compte</li>
                <li>Données liées à l'abonnement</li>
                <li>Paramètres de filtres et d'extraction</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Les contenus des emails ne sont traités que pour l'extraction
                demandée.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                3. Utilisation des données
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Les données sont utilisées pour :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Fournir le service d'extraction</li>
                <li>Gérer les abonnements</li>
                <li>Améliorer l'expérience utilisateur</li>
                <li>Assurer la sécurité du service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                4. Stockage des données
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Les emails ne sont pas stockés de manière permanente</li>
                <li>
                  Les données sont hébergées sur une infrastructure cloud
                  sécurisée
                </li>
                <li>L'accès est strictement limité</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                5. Partage des données
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Aucune donnée n'est vendue ou partagée avec des tiers, hors
                prestataires techniques nécessaires (ex : paiement).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                6. Vos droits
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Conformément au RGPD, vous disposez d'un droit :
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>D'accès</li>
                <li>De rectification</li>
                <li>De suppression de vos données</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Vous pouvez nous contacter à tout moment.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;