import { ShieldCheck, Lock, Server, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: ShieldCheck,
    title: "Conforme RGPD",
    description: "Respect total de la réglementation européenne sur la protection des données.",
  },
  {
    icon: Lock,
    title: "Aucun contenu stocké",
    description: "Vos emails ne sont jamais enregistrés sur nos serveurs.",
  },
  {
    icon: FileCheck,
    title: "Traitement avec autorisation",
    description: "L'extraction ne se fait qu'avec votre consentement explicite.",
  },
  {
    icon: Server,
    title: "Infrastructure sécurisée",
    description: "Nos services s'appuient sur des infrastructures cloud reconnues et sécurisées.",
  },
];

const SecuritySection = () => {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sécurité et conformité
            </h2>
            <p className="text-lg text-muted-foreground">
              Vos données sont entre de bonnes mains. Nous prenons la sécurité au sérieux.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
