import React from 'react';
import { FIFA_STADIUMS } from '../constants/stadiums';

export default function Header({ currentStadium, currentPersona, onStadiumChange }) {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200">
      <div className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
        <svg className="w-6.5 h-6.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0110 10m-10 10a10 10 0 01-10-10M12 2v20M2 12h20" />
        </svg>
        <span>StadiumIQ</span>
      </div>
      
      <div className="flex-1 max-w-xs mx-4">
        <select
          value={currentStadium?.id || ''}
          onChange={(e) => onStadiumChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
        >
          {FIFA_STADIUMS.map(stadium => (
            <option key={stadium.id} value={stadium.id}>
              {stadium.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          {currentPersona?.icon} {currentPersona?.label || 'User'}
        </span>
      </div>
    </header>
  );
}
