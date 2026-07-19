export const requestLog = [];

export function canMakeRequest() {
  const now = Date.now();
  const cutoff = now - 60000;
  
  // Filter out timestamps older than 60 seconds in place
  while (requestLog.length > 0 && requestLog[0] < cutoff) {
    requestLog.shift();
  }
  
  return requestLog.length < 14;
}

export function logRequest() {
  requestLog.push(Date.now());
}

export function getWaitTime() {
  if (canMakeRequest()) {
    return 0;
  }
  if (requestLog.length === 0) {
    return 0;
  }
  const now = Date.now();
  const oldest = requestLog[0];
  const waitMs = (oldest + 60000) - now;
  return Math.max(0, Math.ceil(waitMs / 1000));
}
