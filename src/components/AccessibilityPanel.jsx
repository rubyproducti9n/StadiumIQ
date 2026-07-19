import React from 'react';

export default function AccessibilityPanel({ stadium }) {
  const accessibilityItems = stadium?.facilities?.accessibility || [];

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        ♿ Accessible Facilities
      </h3>
      
      {accessibilityItems.length > 0 ? (
        <ul className="space-y-2 text-sm text-gray-700">
          {accessibilityItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-gray-50 p-2.5 rounded-md border border-gray-100">
              <span className="text-blue-600 font-semibold" aria-hidden="true">♿</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No accessibility data available for this stadium.</p>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-xs font-medium">
        StadiumIQ prioritizes accessible routing for all users. Mention your accessibility needs in the chat for personalized guidance.
      </div>
    </div>
  );
}
