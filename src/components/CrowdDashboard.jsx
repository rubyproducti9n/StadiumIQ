import React from 'react';

export default function CrowdDashboard({ crowdData, stadium, smartSummary, isSummaryLoading }) {
  if (!crowdData) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Crowd Operations Dashboard</h3>
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getFillColor = (pct) => {
    if (pct < 70) return 'text-green-600 bg-green-50 border-green-200';
    if (pct < 90) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'open') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Open</span>;
    }
    if (s === 'moderate') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Moderate</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Busy</span>;
  };

  // Resolve capacity percentage from Firestore object OR parsed Excel sheet object
  const fillPct = crowdData.overallFillPercentage !== undefined 
    ? crowdData.overallFillPercentage 
    : Math.round((crowdData.occupancy_pct || 0) * 100);

  let overallColorClass = 'text-green-600';
  if (fillPct >= 70 && fillPct < 90) overallColorClass = 'text-yellow-500';
  if (fillPct >= 90) overallColorClass = 'text-red-600';

  // Adapt gates: if excel data, let's map fan_zone_A, B, C, D as Gates/Zones
  const gates = crowdData.gates || [
    { name: 'Zone A', waitTimeMin: Math.round((crowdData.fan_zone_A || 0) / 100), status: (crowdData.fan_zone_A > 2000 ? 'busy' : 'open') },
    { name: 'Zone B', waitTimeMin: Math.round((crowdData.fan_zone_B || 0) / 100), status: (crowdData.fan_zone_B > 2000 ? 'busy' : 'open') },
    { name: 'Zone C', waitTimeMin: Math.round((crowdData.fan_zone_C || 0) / 100), status: (crowdData.fan_zone_C > 2000 ? 'busy' : 'open') },
    { name: 'Zone D', waitTimeMin: Math.round((crowdData.fan_zone_D || 0) / 100), status: (crowdData.fan_zone_D > 2000 ? 'busy' : 'open') }
  ];

  // Adapt sections:
  const sections = crowdData.sections || [
    { name: 'Home Fans', percentage: Math.round(((crowdData.home_fans || 0) / (crowdData.actual_attendance || 1)) * 100) },
    { name: 'Away Fans', percentage: Math.round(((crowdData.away_fans || 0) / (crowdData.actual_attendance || 1)) * 100) },
    { name: 'Neutral', percentage: Math.round(((crowdData.neutral_fans || 0) / (crowdData.actual_attendance || 1)) * 100) },
    { name: 'VIP Fill', percentage: Math.round((crowdData.vip_section_fill_pct || 0) * 100) }
  ];

  // Adapt food courts (or show general summary details like sentiment, dominant language, incident flags):
  const foodCourts = crowdData.foodCourts || [
    { location: `Incident Level: ${crowdData.incident_flags}`, level: crowdData.incident_flags === 'none' ? 'open' : 'busy', waitTimeMin: crowdData.incident_flags === 'none' ? 0 : 30 },
    { location: `Dominant Language: ${crowdData.dominant_language}`, level: 'open', waitTimeMin: 0 },
    { location: `Chant Intensity`, level: crowdData.chant_intensity > 7 ? 'busy' : 'open', waitTimeMin: crowdData.chant_intensity }
  ];

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Crowd Operations - {stadium?.name || 'Stadium'}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">Overall Capacity:</span>
          <span className={`text-2xl font-extrabold ${overallColorClass}`}>
            {fillPct}%
          </span>
        </div>
      </div>

      {/* Smart Summary Banner */}
      {isSummaryLoading ? (
        <div className="p-4 bg-gray-100 text-gray-500 rounded-lg animate-pulse flex flex-col gap-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      ) : smartSummary ? (
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-sm">
          <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-yellow-300 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>StadiumIQ Smart Summary</span>
          </h4>
          <p className="text-xs leading-relaxed opacity-95 whitespace-pre-line">{smartSummary}</p>
        </div>
      ) : null}

      {/* Gates status */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Gate Entry Points</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-2">Gate / Zone Name</th>
                <th className="px-4 py-2">Wait / Est. Wait</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
              {gates.map((gate, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{gate.name}</td>
                  <td className="px-4 py-2">{gate.waitTimeMin} mins</td>
                  <td className="px-4 py-2">{getStatusBadge(gate.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections grid */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Zone & Section Density</h4>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {sections.map((sec, i) => (
            <div
              key={i}
              className={`p-2 border rounded-md text-center flex flex-col justify-center ${getFillColor(sec.percentage)}`}
            >
              <span className="text-xs font-bold">{sec.name}</span>
              <span className="text-sm font-semibold">{sec.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Food courts / Operational Metrics status */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Operational Wait Times & Metrics</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-2">Location / Metric</th>
                <th className="px-4 py-2">Level / Value</th>
                <th className="px-4 py-2">Est. Wait / Intensity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800 font-medium">
              {foodCourts.map((court, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{court.location}</td>
                  <td className="px-4 py-2 capitalize">{getStatusBadge(court.level)}</td>
                  <td className="px-4 py-2">{court.waitTimeMin} mins</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
