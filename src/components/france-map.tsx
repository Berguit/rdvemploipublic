'use client';

import { useState } from 'react';
import franceMap from '@svg-maps/france.departments';
import Link from 'next/link';

// Mock data for department job counts
const mockData: Record<string, { name: string; count: number }> = {
  "75": { name: "Paris", count: 1245 },
  "13": { name: "Bouches-du-Rhône", count: 890 },
  "69": { name: "Rhône", count: 756 },
  "31": { name: "Haute-Garonne", count: 623 },
  "33": { name: "Gironde", count: 578 },
  "59": { name: "Nord", count: 534 },
  "44": { name: "Loire-Atlantique", count: 445 },
  "67": { name: "Bas-Rhin", count: 398 },
  "34": { name: "Hérault", count: 367 },
  "06": { name: "Alpes-Maritimes", count: 334 },
  "92": { name: "Hauts-de-Seine", count: 312 },
  "94": { name: "Val-de-Marne", count: 289 },
  "93": { name: "Seine-Saint-Denis", count: 267 },
  "77": { name: "Seine-et-Marne", count: 245 },
  "78": { name: "Yvelines", count: 223 },
  "35": { name: "Ille-et-Vilaine", count: 201 },
  "38": { name: "Isère", count: 189 },
  "76": { name: "Seine-Maritime", count: 167 },
  "14": { name: "Calvados", count: 145 },
  "84": { name: "Vaucluse", count: 134 },
  "74": { name: "Haute-Savoie", count: 123 },
  "56": { name: "Morbihan", count: 112 },
  "29": { name: "Finistère", count: 101 },
  "64": { name: "Pyrénées-Atlantiques", count: 89 },
  "17": { name: "Charente-Maritime", count: 78 },
  "85": { name: "Vendée", count: 67 },
  "72": { name: "Sarthe", count: 56 },
  "49": { name: "Maine-et-Loire", count: 45 },
  "37": { name: "Indre-et-Loire", count: 34 },
  "01": { name: "Ain", count: 23 }
};

// Department type from the SVG map
interface Department {
  id: string;
  name: string;
  path: string;
}

// Get color based on job count (heatmap)
function getColor(count: number): string {
  const maxCount = Math.max(...Object.values(mockData).map(d => d.count));
  const minCount = Math.min(...Object.values(mockData).map(d => d.count));
  const ratio = (count - minCount) / (maxCount - minCount);
  
  // Color scale from light blue (#e0f2fe) to dark blue (#1e3a5f)
  const lightBlue = { r: 224, g: 242, b: 254 };
  const darkBlue = { r: 30, g: 58, b: 95 };
  
  const r = Math.round(lightBlue.r + (darkBlue.r - lightBlue.r) * ratio);
  const g = Math.round(lightBlue.g + (darkBlue.g - lightBlue.g) * ratio);
  const b = Math.round(lightBlue.b + (darkBlue.b - lightBlue.b) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}

interface TooltipProps {
  x: number;
  y: number;
  department: string;
  count: number;
}

function Tooltip({ x, y, department, count }: TooltipProps) {
  return (
    <div
      className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg text-sm z-50 pointer-events-none shadow-lg"
      style={{
        left: `${x}px`,
        top: `${y - 10}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="font-semibold">{department}</div>
      <div className="text-gray-300">{count} offres</div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  );
}

export default function FranceMap() {
  const [hoveredDepartment, setHoveredDepartment] = useState<{
    id: string;
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseEnter = (event: React.MouseEvent, department: Department) => {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const data = mockData[department.id] || { name: department.name, count: 0 };
    
    setHoveredDepartment({
      id: department.id,
      name: data.name,
      count: data.count,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredDepartment) {
      setHoveredDepartment(prev => prev ? {
        ...prev,
        x: event.clientX,
        y: event.clientY
      } : null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredDepartment(null);
  };

  return (
    <div className="relative w-full">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--brand-primary)' }}>
          Offres d'emploi par département
        </h2>
        
        <div className="relative flex justify-center">
          <svg
            viewBox={franceMap.viewBox}
            className="w-full max-w-3xl h-auto"
            onMouseMove={handleMouseMove}
          >
            {franceMap.locations.map((department: Department) => {
              const data = mockData[department.id] || { name: department.name, count: 0 };
              const color = data.count > 0 ? getColor(data.count) : '#f3f4f6';
              
              return (
                <Link
                  key={department.id}
                  href={`/offres?departement=${department.id}`}
                  className="group"
                >
                  <path
                    d={department.path}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="transition-all duration-200 hover:opacity-80 hover:scale-105 cursor-pointer"
                    style={{ transformOrigin: 'center' }}
                    onMouseEnter={(e) => handleMouseEnter(e, department)}
                    onMouseLeave={handleMouseLeave}
                    aria-label={`${data.name} - ${data.count} offres d'emploi`}
                    role="button"
                    tabIndex={0}
                  />
                </Link>
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span>Peu d'offres</span>
          <div className="flex space-x-1">
            <div className="w-4 h-4 bg-blue-100 border border-gray-300"></div>
            <div className="w-4 h-4 bg-blue-300 border border-gray-300"></div>
            <div className="w-4 h-4 bg-blue-500 border border-gray-300"></div>
            <div className="w-4 h-4 bg-blue-700 border border-gray-300"></div>
            <div className="w-4 h-4 bg-blue-900 border border-gray-300"></div>
          </div>
          <span>Beaucoup d'offres</span>
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredDepartment && (
        <Tooltip
          x={hoveredDepartment.x}
          y={hoveredDepartment.y}
          department={hoveredDepartment.name}
          count={hoveredDepartment.count}
        />
      )}
    </div>
  );
}