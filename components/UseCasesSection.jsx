import { Users, Target, BarChart3, ShieldCheck } from "lucide-react";

const useCases = [
  {
    icon: Users,
    text: "Centralisent des demandes clients par email",
  },
  {
    icon: Target,
    text: "Extraient des leads automatiquement",
  },
  {
    icon: BarChart3,
    text: "Automatisent le reporting",
  },
  {
    icon: ShieldCheck,
    text: "Traitent des volumes importants d'emails sans erreur humaine",
  },
];

const UseCasesSection = () => {
  return (
    <section className="py-20 lg:py-28 section-alt">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Idéal pour les professionnels qui…
            </h2>
            <p className="text-lg text-muted-foreground">
              Gagnez du temps, évitez les erreurs humaines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="flex items-center gap-5 p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card group"
              >
                <div className="w-12 h-12 rounded-lg bg-feature-icon-bg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <useCase.icon className="w-6 h-6 text-feature-icon" />
                </div>
                <span className="text-lg font-medium text-foreground">
                  {useCase.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
