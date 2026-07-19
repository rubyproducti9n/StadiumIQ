import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logCustomEvent } from './analytics';

export async function getCrowdData(stadiumId) {
  const mockData = {
    stadiumId,
    timestamp: Date.now(),
    overallFillPercentage: 78,
    gates: [
      { name: 'North Gate', waitTimeMin: 5, status: 'open' },
      { name: 'South Gate', waitTimeMin: 22, status: 'busy' },
      { name: 'East Gate', waitTimeMin: 10, status: 'moderate' },
      { name: 'West Gate', waitTimeMin: 8, status: 'open' }
    ],
    sections: [
      { name: 'A1', percentage: 65 },
      { name: 'A2', percentage: 92 },
      { name: 'B1', percentage: 74 },
      { name: 'B2', percentage: 88 },
      { name: 'C1', percentage: 45 },
      { name: 'C2', percentage: 98 },
      { name: 'VIP', percentage: 60 },
      { name: 'Media', percentage: 30 }
    ],
    foodCourts: [
      { location: 'Main Food Hall (Gate North, Sec A1)', level: 'busy', waitTimeMin: 15 },
      { location: 'Concourse Food Court (Gate East, Sec B2)', level: 'moderate', waitTimeMin: 8 },
      { location: 'Gluten-Free Station (Gate West, Sec C1)', level: 'open', waitTimeMin: 3 }
    ]
  };

  try {
    const crowdDocRef = doc(db, 'match', stadiumId, 'crowd', 'live');
    const docSnap = await getDoc(crowdDocRef);
    if (docSnap.exists()) {
      logCustomEvent('crowd_data_loaded', { stadiumId, source: 'firestore' });
      return {
        ...mockData,
        ...docSnap.data()
      };
    } else {
      logCustomEvent('crowd_data_loaded', { stadiumId, source: 'mock_fallback' });
    }
  } catch (error) {
    console.error("Error fetching crowd data from Firestore:", error);
    logCustomEvent('crowd_data_loaded', { stadiumId, source: 'error_fallback' });
  }

  return mockData;
}
