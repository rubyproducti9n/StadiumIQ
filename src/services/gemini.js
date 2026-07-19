import { sanitizeInput, isValidInput } from '../utils/sanitize';
import { canMakeRequest, logRequest } from '../utils/rateLimit';
import { getCachedResponse, setCachedResponse } from '../utils/cache';
import { isVagueQuestion, fetchWithRetry } from '../utils/errorHandler';
import { logCustomEvent } from './analytics';
import { CROWD_STORAGE_KEY, GEMINI_MODEL, MAX_RETRIES } from '../constants';

export const SYSTEM_PROMPT = `You are StadiumIQ, an AI-powered smart assistant for FIFA World Cup 2026 stadiums in the USA.
- You help fans and staff navigate stadiums, understand crowd conditions, find facilities, get transport info, and receive safety/accessibility support.
- You can respond in any language the user writes in. Always reply in the same language the user used.
- You are context-aware: if the user says they use a wheelchair or have a disability, always prioritize accessible routes and facilities.
- For navigation questions, always give step-by-step directions using gate names, section numbers, and landmarks.
- For crowd questions, reference the crowd data provided to you in the message context.
- For transport questions, give specific options: metro/subway lines, bus numbers, parking zones.
- For staff/volunteer mode: give operational recommendations, crowd redistribution advice, and alert-style responses.
- Always be concise, helpful, and friendly. Do not make up information. If you do not know something specific, say so clearly.
- Never discuss anything unrelated to stadium operations, FIFA 2026, navigation, facilities, crowds, transport, or safety.`;

/**
 * Builds the prompt string dynamically injecting the match contexts.
 * @param {string} userMessage - Sanitized user input question.
 * @param {Object} persona - Selected user persona information.
 * @param {Object} stadium - Active stadium metrics metadata.
 * @param {Object} crowdData - Current parsed stadium crowd data metrics.
 * @param {string} [geminiContext=""] - Compiled crowd context from excel template.
 * @returns {string} The formatted prompt string.
 */
export function buildPrompt(userMessage, persona, stadium, crowdData, geminiContext = "") {
  const personaLabel = persona?.label || 'Visitor';
  const stadiumName = stadium?.name || 'the stadium';
  const stadiumCity = stadium?.city || 'USA';
  const capacity = stadium?.capacity ? `Stadium capacity: ${stadium.capacity}.` : '';

  // LocalStorage lookup fallback
  let matchContext = geminiContext;
  if (!matchContext && stadium?.id) {
    try {
      const stored = localStorage.getItem(CROWD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[stadium.id]?.gemini_context) {
          matchContext = parsed[stadium.id].gemini_context;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const contextBlock = `CONTEXT: User is a ${personaLabel} at ${stadiumName}, ${stadiumCity}. ${capacity}`;
  const crowdBlock = matchContext 
    ? `CROWD CONTEXT:\n${matchContext}`
    : `CROWD DATA: ${crowdData ? JSON.stringify(crowdData) : 'No crowd data available'}`;
  
  let userMsgBlock = `USER: ${userMessage}`;
  if (isVagueQuestion(userMessage)) {
    userMsgBlock += `\nINSTRUCTION: The user's question is vague or very brief. Do not guess what they want. Instead, ask a polite clarifying question to understand what specific stadium facility, transport option, or match detail they need help with.`;
  }

  return `${contextBlock}\n${crowdBlock}\n${userMsgBlock}`;
}

/**
 * Communicates with Gemini API to answer stadium queries.
 * @param {string} userMessage - Raw user chat entry.
 * @param {Object} persona - Currently active user persona structure.
 * @param {Object} stadium - Active stadium details.
 * @param {Object} crowdData - Match crowd operations metrics.
 * @param {Function} [onRetry=null] - Backoff delay retry callback.
 * @param {string} [geminiContext=""] - Explicit spreadsheet context string.
 * @returns {Promise<string>} Gemini response text.
 */
export async function askGemini(userMessage, persona, stadium, crowdData, onRetry = null, geminiContext = "") {
  try {
    if (!isValidInput(userMessage)) {
      throw new Error("Invalid input");
    }

    const cleanedMessage = sanitizeInput(userMessage);
    const cacheKey = userMessage.toLowerCase().trim();
    
    // Check Cache
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse !== null) {
      return cachedResponse;
    }

    // Check Rate Limit
    if (!canMakeRequest()) {
      throw new Error("Rate limit reached. Please wait a moment.");
    }

    // Log Request
    logRequest();

    // Build Prompt with geminiContext
    const prompt = buildPrompt(cleanedMessage, persona, stadium, crowdData, geminiContext);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7
        }
      })
    }, MAX_RETRIES, 1000, onRetry);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("Empty response received from Gemini API");
    }

    setCachedResponse(cacheKey, resultText);
    return resultText;
  } catch (error) {
    throw new Error(error.message || "Failed to communicate with assistant");
  }
}

/**
 * Validates the configured Gemini key connection.
 * @returns {Promise<boolean>} Resolves to true if key is valid.
 */
export async function testGeminiConnection() {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: "Hello" }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      })
    }, MAX_RETRIES, 1000);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return !!resultText;
  } catch (error) {
    return false;
  }
}

/**
 * Analyzes the language of a text string.
 * @param {string} text - Text to analyze.
 * @param {Function} [onRetry=null] - Rate limit backoff callbacks.
 * @returns {Promise<Object>} The language detection result.
 */
async function detectLanguage(text, onRetry = null) {
  try {
    const cached = sessionStorage.getItem('detected_language');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.confidence === 'number' && parsed.iso) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read from sessionStorage:", e);
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let response;
  try {
    response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze the language of the following text. Respond strictly with a JSON object containing "language" (full language name, e.g. "Spanish"), "iso" (2-letter ISO 639-1 code, e.g. "es"), and "confidence" (number between 0 and 1). Do not include any markdown formatting, backticks, or other text outside the JSON.

Text to analyze:
"${text}"`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    }, MAX_RETRIES, 1000, onRetry);
  } catch (err) {
    throw new Error("LANGUAGE_DETECTION_FAILED");
  }

  if (!response.ok) {
    throw new Error("LANGUAGE_DETECTION_FAILED");
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    throw new Error("LANGUAGE_DETECTION_FAILED");
  }

  try {
    const parsed = JSON.parse(resultText.trim());
    if (parsed && typeof parsed.confidence === 'number' && parsed.iso) {
      sessionStorage.setItem('detected_language', JSON.stringify(parsed));
      logCustomEvent('language_detected', { language: parsed.language, iso: parsed.iso, confidence: parsed.confidence, source: 'api_detection' });
      return parsed;
    }
  } catch (err) {
    throw new Error("LANGUAGE_DETECTION_FAILED");
  }
  
  throw new Error("LANGUAGE_DETECTION_FAILED");
}

/**
 * Translates a text string.
 * @param {string} text - Text to translate.
 * @param {string} fromLang - Source language.
 * @param {string} toLang - Target language.
 * @param {Function} [onRetry=null] - Rate limit retry call.
 * @returns {Promise<string>} The translated text.
 */
async function translateText(text, fromLang, toLang, onRetry = null) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Translate the following text from ${fromLang} to ${toLang}. Provide only the translation, with no explanation or extra text.

Text to translate:
"${text}"`
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.3
      }
    })
  }, MAX_RETRIES, 1000, onRetry);

  if (!response.ok) {
    throw new Error(`Failed to translate text to ${toLang}`);
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    throw new Error("Failed to translate text: empty response");
  }

  return resultText.trim();
}

/**
 * Intercepts Gemini calls to translate incoming/outgoing strings if non-English language is detected.
 * @param {string} userInput - The user's query message.
 * @param {Function} geminiCall - The underlying askGemini invocation promise.
 * @param {Function} [onRetry=null] - Delay timer callback parameters.
 * @returns {Promise<string>} The localized output string.
 */
export async function wrapWithTranslation(userInput, geminiCall, onRetry = null) {
  let detected = null;
  try {
    detected = await detectLanguage(userInput, onRetry);
  } catch (error) {
    console.error("Language detection failed:", error);
    throw new Error("LANGUAGE_DETECTION_FAILED");
  }

  const isEnglish = !detected || 
                    detected.confidence < 0.8 || 
                    detected.iso.toLowerCase() === 'en' || 
                    detected.language.toLowerCase() === 'english';

  if (isEnglish) {
    return await geminiCall(userInput);
  }

  const englishInput = await translateText(userInput, detected.language, "English", onRetry);
  const englishResponse = await geminiCall(englishInput);
  const translatedResponse = await translateText(englishResponse, "English", detected.language, onRetry);
  return translatedResponse;
}

/**
 * Generates a 3-line smart operations overview summary banner.
 * @param {Object} stadium - Active stadium details.
 * @param {Object} crowdData - Match crowd metrics.
 * @returns {Promise<string>} The generated summary string.
 */
export async function generateSmartSummary(stadium, crowdData) {
  const stadiumName = stadium?.name || 'the stadium';
  const city = stadium?.city || 'USA';
  
  // Calculate fill percentage dynamically
  let fillPct = 78;
  if (crowdData) {
    if (crowdData.overallFillPercentage !== undefined) {
      fillPct = crowdData.overallFillPercentage;
    } else if (crowdData.occupancy_pct !== undefined) {
      fillPct = Math.round(crowdData.occupancy_pct * 100);
    }
  }

  const cacheKey = `stadiumiq_summary_${stadium?.id || 'default'}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.error(e);
  }

  const prompt = `Generate a concise 3-line "What to know" summary for fans attending the match at ${stadiumName} in ${city}.
- Reference current crowd density (${fillPct}% capacity).
- Reference facilities or transport options (e.g. Metro, Bus, or Food Hall).
- Keep it friendly, positive, and strictly under 3 sentences. Do not use markdown bullet points.`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.5
      }
    })
  }, MAX_RETRIES, 1000);

  if (!response.ok) {
    throw new Error("Failed to generate smart summary");
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const summary = resultText ? resultText.trim() : "Live match details are loaded. Safe travels to the stadium!";

  try {
    localStorage.setItem(cacheKey, summary);
  } catch (e) {
    console.error(e);
  }

  return summary;
}

/**
 * Classifies a user question's intent.
 * @param {string} text - User message input.
 * @returns {Promise<string>} The classified sentiment string.
 */
export async function classifySentiment(text) {
  const prompt = `Classify the sentiment/intent of the following user question into exactly one of these categories: hype, tactical, logistical, emotional.
Return only the category name in lowercase (no punctuation, no other text).

User question: "${text}"`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1
      }
    })
  }, MAX_RETRIES, 1000);

  if (!response.ok) {
    return 'logistical';
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const classification = resultText ? resultText.trim().toLowerCase() : 'logistical';
  
  if (['hype', 'tactical', 'logistical', 'emotional'].includes(classification)) {
    return classification;
  }
  return 'logistical';
}
