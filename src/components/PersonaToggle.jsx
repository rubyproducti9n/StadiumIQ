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
            className={`px-4 py-2 rounded-md border-2 transition-all ${
              isActive
                ? 'bg-blue-600 border-blue-600 text-white font-bold'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{persona.icon}</span>
            {persona.label}
          </button>
        );
      })}
    </div>
  );
}
