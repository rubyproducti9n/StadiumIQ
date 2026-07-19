import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { askGemini, buildPrompt, wrapWithTranslation } from '../gemini';

vi.mock('../../utils/sanitize', () => ({
  isValidInput: vi.fn(() => true),
  sanitizeInput: vi.fn(x => x)
}));

vi.mock('../../utils/rateLimit', () => ({
  canMakeRequest: vi.fn(() => true),
  logRequest: vi.fn()
}));

vi.mock('../../utils/cache', () => ({
  getCachedResponse: vi.fn(() => null),
  setCachedResponse: vi.fn()
}));

describe('gemini service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prepends crowd context when available', () => {
    const prompt = buildPrompt(
      'Is it crowded?',
      { label: 'Fan' },
      { name: 'MetLife Stadium', id: 'metlife' },
      null,
      'Match context: USA vs Mexico'
    );
    expect(prompt).toContain('CROWD CONTEXT:\nMatch context: USA vs Mexico');
  });

  it('falls back to empty string/default when no crowd context', () => {
    const prompt = buildPrompt(
      'Is it crowded?',
      { label: 'Fan' },
      { name: 'MetLife Stadium', id: 'metlife' },
      null,
      ''
    );
    expect(prompt).toContain('CROWD DATA: No crowd data available');
  });

  it('retries on 429 response (mock fetch)', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 2) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        };
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Successful after retry' }] } }]
        })
      };
    });

    const promise = askGemini('Hello', { label: 'Fan' }, { name: 'MetLife' }, null, null, 'Context');
    // Pre-emptively register catch to prevent unhandled rejection warnings in CI environment
    promise.catch(() => {});
    
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(callCount).toBe(2);
    expect(result).toBe('Successful after retry');
    vi.useRealTimers();
  });

  it('returns fallback message after 3 failed retries', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    const promise = askGemini('Hello', { label: 'Fan' }, { name: 'MetLife' }, null, null, 'Context');
    // Pre-emptively register catch to prevent unhandled rejection warnings in CI environment
    promise.catch(() => {});
    
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow("Failed to contact Gemini after 3 attempts due to rate limits.");
    vi.useRealTimers();
  });

  it('detects language correctly from mock response', async () => {
    const mockDetectJson = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ language: 'Spanish', iso: 'es', confidence: 0.95 }) }] } }]
    };
    const mockTranslateToEnglishJson = {
      candidates: [{ content: { parts: [{ text: 'Hello' }] } }]
    };
    const mockTranslateToSpanishJson = {
      candidates: [{ content: { parts: [{ text: 'Hola, ¿cómo estás?' }] } }]
    };

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockDetectJson })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTranslateToEnglishJson })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTranslateToSpanishJson });

    const geminiCall = vi.fn().mockResolvedValue('Hello visitor!');
    const result = await wrapWithTranslation('Hola', geminiCall);

    expect(result).toBe('Hola, ¿cómo estás?');
    expect(geminiCall).toHaveBeenCalledWith('Hello');
  });

  it('handles empty/vague user input with clarification prompt', () => {
    const prompt = buildPrompt(
      'help', // vague brief input
      { label: 'Fan' },
      { name: 'MetLife Stadium' },
      null,
      ''
    );
    expect(prompt).toContain('INSTRUCTION: The user\'s question is vague or very brief. Do not guess what they want. Instead, ask a polite clarifying question');
  });
});
