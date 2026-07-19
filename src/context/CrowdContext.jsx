import React, { createContext, useContext, useState, useEffect } from 'react';

const CrowdContext = createContext();

export function CrowdProvider({ children }) {
  const [crowdData, setCrowdData] = useState(() => {
    try {
      const stored = localStorage.getItem('stadiumiq_crowd_data');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored crowd data, clearing key:", e);
      localStorage.removeItem('stadiumiq_crowd_data');
    }
    return {};
  });

  const [storageError, setStorageError] = useState(null);

  const updateCrowdData = (newMatches) => {
    setCrowdData(prev => {
      const updated = { ...prev, ...newMatches };
      try {
        localStorage.setItem('stadiumiq_crowd_data', JSON.stringify(updated));
        setStorageError(null);
      } catch (error) {
        console.error("localStorage quota exceeded, storing in-memory only:", error);
        setStorageError("Storage quota exceeded! Match data will not persist after refresh.");
      }
      return updated;
    });
  };

  const getMatchCrowd = (matchId) => {
    return crowdData[matchId] || null;
  };

  return (
    <CrowdContext.Provider value={{ crowdData, updateCrowdData, getMatchCrowd, storageError }}>
      {children}
    </CrowdContext.Provider>
  );
}

export function useCrowd() {
  const context = useContext(CrowdContext);
  if (!context) {
    throw new Error('useCrowd must be used within a CrowdProvider');
  }
  return context;
}
