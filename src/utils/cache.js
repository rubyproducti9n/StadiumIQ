export const responseCache = new Map();

export function getCachedResponse(key) {
  if (typeof key !== 'string') return null;
  const normalizedKey = key.trim().toLowerCase();
  const entry = responseCache.get(normalizedKey);
  if (!entry) return null;
  
  const fiveMinutes = 5 * 60 * 1000;
  if (Date.now() - entry.timestamp < fiveMinutes) {
    return entry.value;
  }
  
  // Clean up expired entry
  responseCache.delete(normalizedKey);
  return null;
}

export function setCachedResponse(key, value) {
  if (typeof key !== 'string') return;
  const normalizedKey = key.trim().toLowerCase();
  responseCache.set(normalizedKey, {
    value,
    timestamp: Date.now()
  });
}

export function clearCache() {
  responseCache.clear();
}
