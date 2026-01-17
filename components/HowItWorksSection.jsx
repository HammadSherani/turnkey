import { SlidersHorizontal, Play, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: SlidersHorizontal,
    title: "Définissez vos filtres Outlook",
    description: "Dates, expéditeur, sujet, mots-clés — configurez vos critères de recherche en quelques clics.",
  },
  {
    number: "02",
    icon: Play,
    title: "Lancez l'extraction en masse",
    description: "Notre outil parcourt vos emails et extrait les données selon vos règles.",
  },
  {
    number: "03",
    icon: Download,
    title: "Téléchargez ou exportez vers Excel",
    description: "Récupérez vos données structurées au format .xlsx, prêtes à être analysées.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="fonctionnement" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comment ça fonctionne
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En 3 étapes simples.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-accent/20 via-accent to-accent/20" />
            
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center group"
              >
                {/* Step number badge */}
                <div className="relative inline-flex mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <step.icon className="w-9 h-9 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center shadow-md">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Video placeholder */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="aspect-video bg-muted rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <p className="text-muted-foreground text-lg">Espace réservé pour la vidéo explicative</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
