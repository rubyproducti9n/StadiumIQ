import { sanitizeInput, isValidInput } from '../utils/sanitize';
import { canMakeRequest, logRequest } from '../utils/rateLimit';
import { getCachedResponse, setCachedResponse } from '../utils/cache';
import { isVagueQuestion, fetchWithRetry } from '../utils/errorHandler';
import { logCustomEvent } from './analytics';
import { useCrowd } from '../context/CrowdContext';

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

export function buildPrompt(userMessage, persona, stadium, crowdData, geminiContext = "") {
  const personaLabel = persona?.label || 'Visitor';
  const stadiumName = stadium?.name || 'the stadium';
  const stadiumCity = stadium?.city || 'USA';
  const capacity = stadium?.capacity ? `Stadium capacity: ${stadium.capacity}.` : '';

  // LocalStorage lookup fallback
  let matchContext = geminiContext;
  if (!matchContext && stadium?.id) {
    try {
      const stored = localStorage.getItem('stadiumiq_crowd_data');
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
    }, 3, 1000, onRetry);

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

export async function testGeminiConnection() {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
                text: "Say hello in one sentence."
              }
            ]
          }
        ]
      })
    }, 3, 1000);

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
    }, 3, 1000, onRetry);
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

async function translateText(text, fromLang, toLang, onRetry = null) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
  }, 3, 1000, onRetry);

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

  const cacheKey = `smart_summary_${stadium?.id || 'stadium'}_${fillPct}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
  }, 3, 1000);

  if (!response.ok) {
    throw new Error("Failed to generate smart summary");
  }

  const data = await response.json();
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const summary = resultText ? resultText.trim() : "Live match details are loaded. Safe travels to the stadium!";

  try {
    sessionStorage.setItem(cacheKey, summary);
  } catch (e) {
    console.error(e);
  }

  return summary;
}

export async function classifySentiment(text) {
  const prompt = `Classify the sentiment/intent of the following user question into exactly one of these categories: hype, tactical, logistical, emotional.
Return only the category name in lowercase (no punctuation, no other text).

User question: "${text}"`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
  }, 3, 1000);

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
