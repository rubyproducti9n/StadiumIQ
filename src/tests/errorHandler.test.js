import { isOffTopic, isVagueQuestion, fetchWithRetry } from '../utils/errorHandler';

describe('errorHandler', () => {
  describe('isOffTopic', () => {
    it('returns false for stadium and FIFA related queries', () => {
      expect(isOffTopic('Where is MetLife stadium?')).toBe(false);
      expect(isOffTopic('How do I get transit options?')).toBe(false);
      expect(isOffTopic('fifa tickets')).toBe(false);
    });

    it('returns true for completely unrelated queries', () => {
      expect(isOffTopic('What is the capital of France?')).toBe(true);
      expect(isOffTopic('best chocolate chip cookie recipe')).toBe(true);
    });
  });

  describe('isVagueQuestion', () => {
    it('returns true for empty or extremely vague single word questions', () => {
      expect(isVagueQuestion('?')).toBe(true);
      expect(isVagueQuestion('how')).toBe(true);
      expect(isVagueQuestion('a')).toBe(true);
    });

    it('returns false for detailed questions', () => {
      expect(isVagueQuestion('Where is the medical room?')).toBe(false);
      expect(isVagueQuestion('how do I park at gate A')).toBe(false);
    });
  });

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('retries on 429 status code and eventually succeeds', async () => {
      const mockSuccessResponse = { ok: true, status: 200, json: jest.fn().mockResolvedValue('success') };
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce(mockSuccessResponse);

      const onRetry = jest.fn();
      // Use 1ms delay so it runs fast under real timers
      const result = await fetchWithRetry('http://test.com', {}, 3, 1, onRetry);

      expect(result.status).toBe(200);
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 0.001);
      expect(onRetry).toHaveBeenNthCalledWith(2, 0.002);
    });
  });
});
