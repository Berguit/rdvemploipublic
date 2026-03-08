'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

export default function StatsSection() {
  const data = [
    { name: 'Administrative', value: 35, color: '#1e3a5f' },
    { name: 'Technique', value: 28, color: '#f59e0b' },
    { name: 'Médico-sociale', value: 15, color: '#3b82f6' },
    { name: 'Culturelle', value: 8, color: '#10b981' },
    { name: 'Animation', value: 7, color: '#8b5cf6' },
    { name: 'Sportive', value: 4, color: '#f97316' },
    { name: 'Police', value: 3, color: '#ef4444' }
  ];

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    );
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center">
            <div
              className="w-3 h-3 rounded-sm mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">
              {entry.value} ({entry.payload.value}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
            Répartition par filière
          </h2>
          <p className="text-lg" style={{ color: 'var(--brand-text)' }}>
            Découvrez la distribution des offres d'emploi selon les différentes filières
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="h-80 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats complémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
              9 047
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Offres administrative (35%)
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
              7 212
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Offres technique (28%)
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--brand-primary)' }}>
              3 864
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Offres médico-sociale (15%)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}