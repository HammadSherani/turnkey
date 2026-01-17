import { Filter, Zap, FileSpreadsheet, Shield } from "lucide-react";

const benefits = [
  {
    icon: Filter,
    title: "Filtrage avancé",
    description: "Date, expéditeur, sujet, mots-clés — définissez vos critères avec précision.",
  },
  {
    icon: Zap,
    title: "Extraction en masse",
    description: "Plus besoin de copier-coller. Traitez des centaines d'emails en quelques secondes.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export automatique vers Excel",
    description: "Données structurées, prêtes à analyser. Format .xlsx compatible partout.",
  },
  {
    icon: Shield,
    title: "Rapide & sécurisé",
    description: "Rien n'est stocké sans votre consentement. Vos données restent les vôtres.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="avantages" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pourquoi choisir notre solution ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Arrêtez le copier-coller, automatisez. Vos emails Outlook deviennent des données exploitables.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-feature-icon-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-7 h-7 text-feature-icon" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
