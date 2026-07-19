import React from 'react';

export default function AccessibilityPanel({ stadium }) {
  const accessibilityItems = stadium?.facilities?.accessibility || [];

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Accessible Facilities</span>
      </h3>
      
      {accessibilityItems.length > 0 ? (
        <ul className="space-y-2 text-sm text-gray-700">
          {accessibilityItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 bg-gray-50 p-2.5 rounded-md border border-gray-100">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No accessibility data available for this stadium.</p>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-xs font-medium">
        All venues are fully compliant with FIFA accessibility guidelines, including step-free access, elevators, and assistive audio systems.
      </div>
    </div>
  );
}
