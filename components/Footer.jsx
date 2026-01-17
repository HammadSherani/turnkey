import ContactModal from "./ContactModal";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-bold text-lg">Inbox2Excel</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <a
              href="/terms-of-service"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              CGU
            </a>
            <a
              href="/privacy-policy"
              className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Politique de confidentialité
            </a>
            <ContactModal>
              <button className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Contact
              </button>
            </ContactModal>
          </nav>
        </div>

        {/* Separator & Copyright */}
        <div className="mt-8 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {currentYear} Inbox2Excel. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
