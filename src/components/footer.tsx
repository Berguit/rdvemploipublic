'use client';

import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    site: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Contact', href: '/contact' },
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'CGU', href: '/cgu' }
    ],
    services: [
      { label: 'Offres d\'emploi', href: '/offres' },
      { label: 'Grilles indiciaires', href: '/grilles-indiciaires' },
      { label: 'Calculateur de salaire', href: '/calculateur' },
      { label: 'Fiches métiers', href: '/fiches-metiers' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/rdvemploipublic', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/rdvemploipublic', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/rdvemploipublic', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:contact@rdvemploipublic.fr', label: 'Email' }
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <a href="/" className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                RDV Emploi Public
              </a>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Votre portail de référence pour l'emploi dans la fonction publique territoriale. 
              Trouvez l'opportunité qui vous correspond parmi des milliers d'offres mises à jour quotidiennement.
            </p>
            
            {/* Réseaux sociaux */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md text-gray-400 hover:text-[var(--brand-primary)] hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--brand-primary)' }}>
              NOS SERVICES
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors text-sm min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--brand-primary)' }}>
              INFORMATIONS
            </h3>
            <ul className="space-y-3">
              {footerLinks.site.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors text-sm min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2026 rdvemploipublic.fr - Tous droits réservés
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 text-sm">
                Site réalisé avec ❤️ pour la fonction publique territoriale
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}