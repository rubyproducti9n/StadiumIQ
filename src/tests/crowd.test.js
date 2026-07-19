import { uploadCrowdData, startApiPolling, stopApiPolling } from '../services/CrowdService';
import { setDoc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, matchId, subcol, docId) => ({ path: `${col}/${matchId}/${subcol}/${docId}` })),
  setDoc: jest.fn().mockResolvedValue(true)
}));

jest.mock('../firebase', () => ({
  db: {}
}));

describe('CrowdService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn();
    
    // env vars are statically mock-defined in babel.config.cjs
  });

  afterEach(() => {
    jest.useRealTimers();
    stopApiPolling();
  });

  describe('uploadCrowdData', () => {
    it('should parse and upload JSON file content', async () => {
      const jsonData = { attendance: 50000, chants: ['Let\'s Go!'] };
      const result = await uploadCrowdData('metlife', JSON.stringify(jsonData), 'json');

      expect(result).toEqual(jsonData);
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'match/metlife/crowd/live' }),
        jsonData,
        { merge: true }
      );
    });

    it('should parse and upload CSV file content', async () => {
      const csvData = `attendance,chants\n60000,"[""Go Team!""]"`;
      const result = await uploadCrowdData('metlife', csvData, 'csv');

      expect(result).toEqual({
        attendance: 60000,
        chants: ['Go Team!']
      });
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'match/metlife/crowd/live' }),
        { attendance: 60000, chants: ['Go Team!'] },
        { merge: true }
      );
    });
  });

  describe('startApiPolling', () => {
    const flushPromises = async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };

    it('should poll the endpoint every 60s and merge into Firestore', async () => {
      const apiResponse = { attendance: 75000, status: 'packed' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(apiResponse)
      });

      const callback = jest.fn();
      startApiPolling('metlife', callback);

      // Verify immediate fetch
      await flushPromises();
      expect(global.fetch).toHaveBeenCalledWith('http://mock-api.com', {
        headers: {
          'Authorization': 'Bearer api-key',
          'x-api-key': 'api-key'
        }
      });
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'match/metlife/crowd/live' }),
        apiResponse,
        { merge: true }
      );
      expect(callback).toHaveBeenCalledWith(apiResponse);

      // Verify interval poll
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ attendance: 76000 })
      });

      jest.advanceTimersByTime(60000);
      await flushPromises();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
