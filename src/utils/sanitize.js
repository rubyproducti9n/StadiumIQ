export function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  let cleaned = text.trim();
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove script injection patterns
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/<script/gi, '');
  cleaned = cleaned.replace(/alert\s*\([^)]*\)/gi, '');
  
  // Truncate to max 500 characters
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500);
  }
  
  return cleaned;
}

export function sanitizeResponse(text) {
  if (typeof text !== 'string') return '';
  return text.trim();
}

export function isValidInput(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 500) return false;
  return true;
}
