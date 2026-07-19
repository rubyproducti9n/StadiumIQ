import React from 'react';
import { PERSONAS } from '../constants/personas';

export default function PersonaToggle({ currentPersona, onSwitch }) {
  return (
    <div className="flex gap-4">
      {PERSONAS.map(persona => {
        const isActive = currentPersona?.id === persona.id;
        return (
          <button
            key={persona.id}
            onClick={() => onSwitch(persona.id)}
            className={`px-4 py-2 rounded-md border-2 transition-all flex items-center gap-2 ${
              isActive
                ? 'bg-blue-600 border-blue-600 text-white font-bold'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {persona.id === 'fan' ? (
              <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            <span>{persona.label}</span>
          </button>
        );
      })}
    </div>
  );
}
