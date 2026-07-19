import React, { createContext, useContext, useState } from 'react';
import { CROWD_STORAGE_KEY } from '../constants';

const CrowdContext = createContext();

/**
 * Provides crowd operations and persistence layer context wrapper.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child elements to wrap.
 * @returns {React.JSX.Element} The provider component.
 */
export function CrowdProvider({ children }) {
  const [crowdData, setCrowdData] = useState(() => {
    try {
      const stored = localStorage.getItem(CROWD_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to parse stored crowd data, clearing key:", e);
      localStorage.removeItem(CROWD_STORAGE_KEY);
    }
    return {};
  });

  const [storageError, setStorageError] = useState(null);

  /**
   * Updates state and persists crowd operations datasets dynamically.
   * @param {Object} newMatches - New match datasets to merge.
   * @returns {void}
   */
  const updateCrowdData = (newMatches) => {
    setCrowdData(prev => {
      const updated = { ...prev, ...newMatches };
      try {
        localStorage.setItem(CROWD_STORAGE_KEY, JSON.stringify(updated));
        setStorageError(null);
      } catch (error) {
        console.error("localStorage quota exceeded, storing in-memory only:", error);
        setStorageError("Storage quota exceeded! Match data will not persist after refresh.");
      }
      return updated;
    });
  };

  /**
   * Retrieves crowd metrics for a specific match.
   * @param {string} matchId - The match ID query.
   * @returns {Object|null} Match operations detail or null if missing.
   */
  const getMatchCrowd = (matchId) => {
    return crowdData[matchId] || null;
  };

  return (
    <CrowdContext.Provider value={{ crowdData, updateCrowdData, getMatchCrowd, storageError }}>
      {children}
    </CrowdContext.Provider>
  );
}

/**
 * Accesses current crowd operational state context hooks.
 * @returns {Object} Context API actions and state properties.
 */
export function useCrowd() {
  const context = useContext(CrowdContext);
  if (!context) {
    throw new Error('useCrowd must be used within a CrowdProvider');
  }
  return context;
}
