import { askGemini, wrapWithTranslation, generateSmartSummary, classifySentiment } from '../services/gemini';
import { isValidInput, sanitizeInput } from '../utils/sanitize';
import { canMakeRequest } from '../utils/rateLimit';
import { getCachedResponse, setCachedResponse } from '../utils/cache';

jest.mock('../utils/sanitize', () => ({
  isValidInput: jest.fn(),
  sanitizeInput: jest.fn(),
}));

jest.mock('../utils/rateLimit', () => ({
  canMakeRequest: jest.fn(),
  logRequest: jest.fn(),
}));

jest.mock('../utils/cache', () => ({
  getCachedResponse: jest.fn(),
  setCachedResponse: jest.fn(),
}));

describe('askGemini', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
    global.import = { meta: { env: { VITE_GEMINI_API_KEY: 'mock-key' } } };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws on invalid input', async () => {
    isValidInput.mockReturnValue(false);
    await expect(askGemini('', {}, {}, {})).rejects.toThrow("Invalid input");
  });

  it('returns cached response when cache has a matching key', async () => {
    isValidInput.mockReturnValue(true);
    getCachedResponse.mockReturnValue('cached response text');

    const result = await askGemini('hello', {}, {}, {});
    expect(result).toBe('cached response text');
    expect(getCachedResponse).toHaveBeenCalledWith('hello');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws rate limit error when canMakeRequest returns false', async () => {
    isValidInput.mockReturnValue(true);
    getCachedResponse.mockReturnValue(null);
    canMakeRequest.mockReturnValue(false);

    await expect(askGemini('hello', {}, {}, {})).rejects.toThrow("Rate limit reached. Please wait a moment.");
  });

  it('calls fetch and returns parsed text on success', async () => {
    isValidInput.mockReturnValue(true);
    sanitizeInput.mockReturnValue('hello');
    getCachedResponse.mockReturnValue(null);
    canMakeRequest.mockReturnValue(true);

    const mockResponseText = 'Hello from Gemini!';
    const mockJson = {
      candidates: [
        {
          content: {
            parts: [{ text: mockResponseText }]
          }
        }
      ]
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJson)
    });

    const result = await askGemini('hello', { label: 'Fan' }, { name: 'MetLife', city: 'NJ' }, null);
    expect(result).toBe(mockResponseText);
    expect(global.fetch).toHaveBeenCalled();
    expect(setCachedResponse).toHaveBeenCalledWith('hello', mockResponseText);
  });
});

describe('wrapWithTranslation', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.import = { meta: { env: { VITE_GEMINI_API_KEY: 'mock-key' } } };
  });

  it('should call geminiCall directly if detected language is English', async () => {
    // Mock language detection response
    const mockDetectJson = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ language: 'English', iso: 'en', confidence: 0.95 }) }] } }]
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDetectJson)
    });

    const geminiCall = jest.fn().mockResolvedValue('Hello fan!');
    const result = await wrapWithTranslation('Hello', geminiCall);

    expect(result).toBe('Hello fan!');
    expect(geminiCall).toHaveBeenCalledWith('Hello');
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only called for detection
    expect(sessionStorage.getItem('detected_language')).toContain('English');
  });

  it('should fallback to English if detection confidence is less than 0.8', async () => {
    const mockDetectJson = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ language: 'Spanish', iso: 'es', confidence: 0.5 }) }] } }]
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDetectJson)
    });

    const geminiCall = jest.fn().mockResolvedValue('Hello fan!');
    const result = await wrapWithTranslation('Hola', geminiCall);

    expect(result).toBe('Hello fan!');
    expect(geminiCall).toHaveBeenCalledWith('Hola');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('detected_language')).toContain('Spanish');
  });

  it('should translate input and output if language is not English with high confidence', async () => {
    const mockDetectJson = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ language: 'Spanish', iso: 'es', confidence: 0.9 }) }] } }]
    };
    const mockTranslateToEnglishJson = {
      candidates: [{ content: { parts: [{ text: 'Hello' }] } }]
    };
    const mockTranslateToSpanishJson = {
      candidates: [{ content: { parts: [{ text: 'Hola fan!' }] } }]
    };

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockDetectJson) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockTranslateToEnglishJson) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockTranslateToSpanishJson) });

    const geminiCall = jest.fn().mockResolvedValue('Hello fan!');
    const result = await wrapWithTranslation('Hola', geminiCall);

    expect(result).toBe('Hola fan!');
    expect(geminiCall).toHaveBeenCalledWith('Hello');
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(sessionStorage.getItem('detected_language')).toContain('Spanish');
  });

  it('should use cached language from sessionStorage and bypass detection', async () => {
    sessionStorage.setItem('detected_language', JSON.stringify({ language: 'Spanish', iso: 'es', confidence: 0.9 }));

    const mockTranslateToEnglishJson = {
      candidates: [{ content: { parts: [{ text: 'Hello' }] } }]
    };
    const mockTranslateToSpanishJson = {
      candidates: [{ content: { parts: [{ text: 'Hola fan!' }] } }]
    };

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockTranslateToEnglishJson) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockTranslateToSpanishJson) });

    const geminiCall = jest.fn().mockResolvedValue('Hello fan!');
    const result = await wrapWithTranslation('Hola', geminiCall);

    expect(result).toBe('Hola fan!');
    expect(geminiCall).toHaveBeenCalledWith('Hello');
    expect(global.fetch).toHaveBeenCalledTimes(2); // Only translation calls, no detection
  });
});

describe('generateSmartSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('generates a 3-line summary successfully', async () => {
    const summaryText = "MetLife Stadium is lively today. Crowd is at 78% capacity. Food Hall is busy, consider Gate West options.";
    const mockJson = {
      candidates: [{ content: { parts: [{ text: summaryText }] } }]
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJson)
    });

    const result = await generateSmartSummary({ name: 'MetLife', city: 'NJ' }, { overallFillPercentage: 78 });
    expect(result).toBe(summaryText);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('classifySentiment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('classifies hype sentiment successfully', async () => {
    const mockJson = {
      candidates: [{ content: { parts: [{ text: 'hype' }] } }]
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJson)
    });

    const result = await classifySentiment('Go USA soccer team!');
    expect(result).toBe('hype');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to logistical if category is not recognized', async () => {
    const mockJson = {
      candidates: [{ content: { parts: [{ text: 'random' }] } }]
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockJson)
    });

    const result = await classifySentiment('Where is section A?');
    expect(result).toBe('logistical');
  });
});
