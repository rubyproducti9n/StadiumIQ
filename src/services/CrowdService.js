import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { logCustomEvent } from './analytics';

let pollInterval = null;

export async function uploadCrowdData(matchId, fileContent, fileType) {
  let data = {};
  if (fileType === 'json') {
    data = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
  } else if (fileType === 'csv') {
    data = parseCSV(fileContent);
  } else {
    throw new Error('Unsupported file type');
  }

  const docRef = doc(db, 'match', matchId, 'crowd', 'live');
  await setDoc(docRef, data, { merge: true });
  logCustomEvent('crowd_data_loaded', { matchId, source: 'manual_upload' });
  return data;
}

export function startApiPolling(matchId, callback) {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  const fetchAndMerge = async () => {
    try {
      const url = import.meta.env.VITE_CROWD_API_URL;
      const apiKey = import.meta.env.VITE_CROWD_API_KEY;
      if (!url) {
        console.warn('API URL not configured in .env');
        return;
      }

      const headers = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`API fetch failed with status ${response.status}`);
      }

      const data = await response.json();
      const docRef = doc(db, 'match', matchId, 'crowd', 'live');
      await setDoc(docRef, data, { merge: true });
      logCustomEvent('crowd_data_loaded', { matchId, source: 'api_poll' });
      if (callback) callback(data);
    } catch (error) {
      console.error('Mode B API Polling error:', error);
    }
  };

  // Run immediately
  fetchAndMerge();

  pollInterval = setInterval(fetchAndMerge, 60000);
}

export function stopApiPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return {};
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const values = lines[1].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
  const obj = {};
  headers.forEach((h, i) => {
    let val = (values[i] || '').trim();
    // Replace doubled double-quotes from CSV format
    val = val.replace(/""/g, '"');
    if (!isNaN(val) && val !== '') {
      val = Number(val);
    } else if (val.startsWith('{') || val.startsWith('[')) {
      try {
        val = JSON.parse(val);
      } catch (e) {}
    }
    obj[h] = val;
  });
  return obj;
}
