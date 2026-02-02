import { Button } from "@/components/ui/button";
import { plans } from "@/constants/data";
import { Check, Users } from "lucide-react";
import { useRouter } from "next/navigation";



const PricingSection = () => {
  const router = useRouter();

  const handlePlanSelect = (planId) => {
    // alert(`Selected plan: ${planId}`);
    router.push(`/auth?plan=${planId}`);
  };
  return (
    <section id="tarifs" className="py-20 lg:py-28 section-alt">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Plans & Tarifs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan adapté à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl bg-card p-8 transition-all duration-300 hover:-translate-y-1 ${
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
                onClick={() => handlePlanSelect(plan.id)}
              >
                Choisir {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
