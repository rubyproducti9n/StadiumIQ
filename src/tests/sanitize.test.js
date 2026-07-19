import { sanitizeInput, sanitizeResponse, isValidInput } from '../utils/sanitize';

describe('Sanitization Utils', () => {
  describe('sanitizeInput', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeInput('<div>Hello</div> <p>World</p>')).toBe('Hello World');
    });

    it('should remove script injection patterns', () => {
      expect(sanitizeInput('javascript:alert("hack")')).toBe('');
      expect(sanitizeInput('<script>alert("hack")</script>')).toBe('');
      expect(sanitizeInput('alert(123)')).toBe('');
    });

    it('should truncate text over 500 characters', () => {
      const longText = 'a'.repeat(600);
      const result = sanitizeInput(longText);
      expect(result.length).toBe(500);
      expect(result).toBe('a'.repeat(500));
    });

    it('should normal text pass unchanged (just trimmed)', () => {
      expect(sanitizeInput('   Hello World   ')).toBe('Hello World');
    });
  });

  describe('sanitizeResponse', () => {
    it('should trim whitespace from responses', () => {
      expect(sanitizeResponse('  trusted response from gemini  ')).toBe('trusted response from gemini');
    });
  });

  describe('isValidInput', () => {
    it('should return false for empty string or whitespace only', () => {
      expect(isValidInput('')).toBe(false);
      expect(isValidInput('   ')).toBe(false);
    });

    it('should return false for very short text (1 char)', () => {
      expect(isValidInput('a')).toBe(false);
      expect(isValidInput(' a ')).toBe(false);
    });

    it('should return false for text over 500 characters', () => {
      const longText = 'a'.repeat(501);
      expect(isValidInput(longText)).toBe(false);
    });

    it('should return true for valid normal text', () => {
      expect(isValidInput('valid')).toBe(true);
    });
  });
});
