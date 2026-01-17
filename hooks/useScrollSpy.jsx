"use client"

import { useState, useEffect } from "react";

const useScrollSpy = ({ sectionIds, offset = 100 }) => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset;

      // Find the current section
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = document.getElementById(sectionIds[i]);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          return;
        }
      }

      // If no section is found, set to first section or empty
      if (sectionIds.length > 0) {
        const firstSection = document.getElementById(sectionIds[0]);
        if (firstSection && window.scrollY < firstSection.offsetTop - offset) {
          setActiveSection("");
        }
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return { activeSection, scrollToSection };
};


export default useScrollSpy;
