"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useScrollSpy from "@/hooks/useScrollSpy";
import { useRouter } from "next/navigation";



const navLinks = [
  { id: "avantages", label: "Avantages" },
  { id: "fonctionnement", label: "Comment ça marche" },
  { id: "tarifs", label: "Tarifs" },
];

const Navbar = () => {
  const { activeSection, scrollToSection } = useScrollSpy({
    sectionIds: navLinks.map((link) => link.id),
    offset: 120,
  });

  const router = useRouter();

  const handleClick = (e, sectionId) => {
    e.preventDefault();
    scrollToSection(sectionId);
  };

 const handleLoginClick = () => {
  router.push("/auth?mode=login");  // Ya jo bhi route ho
};

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <span className="font-bold text-lg text-primary-foreground">
              Inbox2Excel
            </span>
          </a>

          {/* Navigation - Centered */}
          <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleClick(e, link.id)}
                className={cn(
                  "relative text-sm font-medium transition-colors duration-300 py-1",
                  "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-accent",
                  "after:transition-all after:duration-300 after:ease-in-out",
                  activeSection === link.id
                    ? "text-primary-foreground after:w-full"
                    : "text-primary-foreground/70 hover:text-primary-foreground after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Button variant="hero" size="sm" onClick={handleLoginClick}>
              Connexion
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-primary-foreground/10 bg-primary/95">
        <div className="flex justify-center gap-6 py-3">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleClick(e, link.id)}
              className={cn(
                "relative text-xs font-medium transition-colors duration-300 py-1",
                "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-accent",
                "after:transition-all after:duration-300 after:ease-in-out",
                activeSection === link.id
                  ? "text-primary-foreground after:w-full"
                  : "text-primary-foreground/70 after:w-0"
              )}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
