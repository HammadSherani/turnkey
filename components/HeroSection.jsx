const HeroSection = () => {
  return (
    <section className="hero-gradient relative overflow-hidden min-h-[60vh] flex items-center">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-primary-foreground leading-tight tracking-tight animate-fade-in-up">
            Transformez vos emails Outlook en données Excel exploitables
          </h1>
        </div>
      </div>

      {/* Wave separator */}
      <div className="absolute -bottom-10 left-0 right-0">
        <svg viewBox="0 0 1440 100" className="w-full ">
          <path
            d="M0 50L48 45.8333C96 41.6667 192 33.3333 288 29.1667C384 25 480 25 576 33.3333C672 41.6667 768 58.3333 864 58.3333C960 58.3333 1056 41.6667 1152 37.5C1248 33.3333 1344 41.6667 1392 45.8333L1440 50V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
            fill="#f7f9fb"
          />
        </svg>
      </div>

    </section>
  );
};

export default HeroSection;
