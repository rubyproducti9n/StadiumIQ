import { MAX_RETRIES } from '../constants';

export const OFF_TOPIC_REDIRECT = "I can only help with FIFA World Cup 2026 stadium operations, navigation, facilities, transport, or safety. How can I assist you with your visit today?";

/**
 * Checks if user message falls outside the scope of FIFA World Cup stadium operations.
 * @param {string} text - User message input query.
 * @returns {boolean} True if query is off-topic.
 */
export function isOffTopic(text) {
  const query = text.toLowerCase();
  
  const allowedKeywords = [
    'stadium', 'fifa', 'world cup', 'match', 'game', 'play', 'team', 'ticket', 'seat', 'gate',
    'entrance', 'exit', 'park', 'transit', 'bus', 'train', 'metro', 'subway', 'coach', 'cab',
    'uber', 'taxi', 'line', 'wait', 'food', 'court', 'drink', 'beer', 'water', 'restroom',
    'toilet', 'bathroom', 'medical', 'aid', 'doctor', 'nurse', 'emergency', 'safety', 'security',
    'police', 'accessibility', 'wheelchair', 'ada', 'elevator', 'ramp', 'deaf', 'blind', 'assist',
    'bag', 'policy', 'schedule', 'time', 'venue', 'crowd', 'density', 'facility', 'map', 'direction',
    'navig', 'route', 'where', 'how', 'hello', 'hi', 'hey', 'help', 'ok', 'yes', 'no', 'thank'
  ];

  const isOnTopic = allowedKeywords.some(keyword => {
    if (keyword.length <= 4) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(query);
    }
    return query.includes(keyword);
  });

  return !isOnTopic;
}

/**
 * Checks if user message is vague.
 * @param {string} text - User query.
 * @returns {boolean} True if vague.
 */
export function isVagueQuestion(text) {
  const query = text.trim().toLowerCase();
  if (query.length < 3) return true;
  
  const vagueWords = ['where', 'how', 'what', 'help', 'stadium', 'match', 'why', 'who', 'tell me', 'show me'];
  if (vagueWords.includes(query) || query === '?') {
    return true;
  }
  return false;
}

/**
 * Executes a network fetch with linear/exponential backoff retry policies on status code 429.
 * @param {string} url - API request URL endpoint.
 * @param {Object} options - Standard fetch options parameters.
 * @param {number} [retries=MAX_RETRIES] - Number of total attempts remaining.
 * @param {number} [delay=1000] - Pause duration parameter before retry execution.
 * @param {Function} [onRetry=null] - Backoff delay callbacks.
 * @returns {Promise<Response>} The network response.
 */
export async function fetchWithRetry(url, options, retries = MAX_RETRIES, delay = 1000, onRetry = null) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429) {
      if (retries > 0) {
        if (onRetry) onRetry(delay / 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2, onRetry);
      }
      throw new Error("Failed to contact Gemini after 3 attempts due to rate limits.");
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      if (onRetry) onRetry(delay / 1000);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2, onRetry);
    }
    throw error;
  }
}
