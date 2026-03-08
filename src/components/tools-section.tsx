'use client';

import { Calculator, FileText, Users } from 'lucide-react';

export default function ToolsSection() {
  const tools = [
    {
      icon: FileText,
      title: 'Grilles indiciaires',
      description: 'Consultez les grilles de rémunération de la fonction publique territoriale',
      href: '/grilles-indiciaires',
      color: 'var(--brand-primary)'
    },
    {
      icon: Calculator,
      title: 'Calculateur de salaire',
      description: 'Estimez votre rémunération selon votre grade et votre échelon',
      href: '/calculateur',
      color: 'var(--brand-accent)'
    },
    {
      icon: Users,
      title: 'Fiches métiers',
      description: 'Découvrez les missions et compétences requises pour chaque métier',
      href: '/fiches-metiers',
      color: 'var(--brand-primary)'
    }
  ];

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: 'var(--brand-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
            Nos outils
          </h2>
          <p className="text-lg" style={{ color: 'var(--brand-text)' }}>
            Découvrez nos outils pour vous accompagner dans votre carrière
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <a
                key={index}
                href={tool.href}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group block min-h-[120px]"
              >
                <div className="flex items-start space-x-4">
                  <div 
                    className="flex-shrink-0 p-3 rounded-lg"
                    style={{ backgroundColor: `${tool.color}15` }}
                  >
                    <IconComponent 
                      className="h-6 w-6"
                      style={{ color: tool.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-semibold mb-2 group-hover:underline"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* CTA supplémentaire */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-primary)' }}>
              Vous êtes employeur ?
            </h3>
            <p className="text-gray-600 mb-6">
              Publiez vos offres d'emploi et trouvez les candidats idéaux pour votre collectivité.
            </p>
            <button
              className="inline-flex items-center px-8 py-3 text-white font-medium rounded-md hover:opacity-90 transition-opacity min-h-[44px]"
              style={{ backgroundColor: 'var(--brand-accent)' }}
            >
              Déposer une offre
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}