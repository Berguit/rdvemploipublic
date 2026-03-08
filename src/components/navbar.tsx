'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { href: '/offres', label: 'Offres' },
    { href: '/grilles-indiciaires', label: 'Grilles indiciaires' },
    { href: '/calculateur', label: 'Calculateur' },
    { href: '/fiches-metiers', label: 'Fiches métiers' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              RDV Emploi Public
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-[var(--brand-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="/deposer-offre"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity min-h-[44px]"
              style={{ backgroundColor: 'var(--brand-accent)' }}
            >
              Déposer une offre
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[var(--brand-primary)] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--brand-primary)] min-h-[44px] min-w-[44px]"
              aria-expanded="false"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-[var(--brand-primary)] block px-3 py-2 rounded-md text-base font-medium min-h-[44px] flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/deposer-offre"
              className="inline-flex items-center px-3 py-2 text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity mt-4 min-h-[44px]"
              style={{ backgroundColor: 'var(--brand-accent)' }}
              onClick={() => setIsMenuOpen(false)}
            >
              Déposer une offre
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}