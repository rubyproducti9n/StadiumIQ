export const OFF_TOPIC_REDIRECT = "I can only help with FIFA World Cup 2026 stadium operations, navigation, facilities, transport, or safety. How can I assist you with your visit today?";

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

export function isVagueQuestion(text) {
  const query = text.trim().toLowerCase();
  if (query.length < 3) return true;
  
  const vagueWords = ['where', 'how', 'what', 'help', 'stadium', 'match', 'why', 'who', 'tell me', 'show me'];
  if (vagueWords.includes(query) || query === '?') {
    return true;
  }
  return false;
}

export async function fetchWithRetry(url, options, retries = 3, delay = 1000, onRetry = null) {
  try {
    const response = await fetch(url, options);
    if (response.status === 429) {
      if (retries > 0) {
        if (onRetry) onRetry(delay / 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2, onRetry);
      }
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
