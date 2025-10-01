/**
 * Unit tests for string helper functions
 * Demonstrates best practices for unit testing
 */

import {
  toTitleCase,
  sanitizeEmail,
  formatPhoneNumber,
  joinWithDelimiter,
  truncate,
} from '../../../src/utils/stringHelpers';

describe('stringHelpers', () => {
  describe('toTitleCase', () => {
    it('should convert lowercase string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should convert uppercase string to title case', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case strings', () => {
      expect(toTitleCase('hElLo WoRlD')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('should return empty string for empty input', () => {
      expect(toTitleCase('')).toBe('');
    });

    it('should handle multiple spaces', () => {
      expect(toTitleCase('hello  world')).toBe('Hello  World');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(sanitizeEmail('John.Doe@Example.COM')).toBe(
        'john.doe@example.com',
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  john.doe@example.com  ')).toBe(
        'john.doe@example.com',
      );
    });

    it('should handle null input', () => {
      expect(sanitizeEmail(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(sanitizeEmail(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBe('');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone number with country code', () => {
      expect(formatPhoneNumber('+1 555-0100')).toBe('+15550100');
    });

    it('should add + prefix if missing', () => {
      expect(formatPhoneNumber('15550100')).toBe('+15550100');
    });

    it('should remove parentheses and dashes', () => {
      expect(formatPhoneNumber('(555) 010-0100')).toBe('+5550100100');
    });

    it('should handle null input', () => {
      expect(formatPhoneNumber(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(formatPhoneNumber(undefined)).toBe('');
    });

    it('should preserve + symbol at start', () => {
      expect(formatPhoneNumber('+44 20 1234 5678')).toBe('+442012345678');
    });
  });

  describe('joinWithDelimiter', () => {
    it('should join array items with semicolon by default', () => {
      expect(joinWithDelimiter(['item1', 'item2', 'item3'])).toBe(
        'item1;item2;item3',
      );
    });

    it('should use custom delimiter', () => {
      expect(joinWithDelimiter(['item1', 'item2'], ', ')).toBe('item1, item2');
    });

    it('should filter out null values', () => {
      expect(joinWithDelimiter(['item1', null, 'item3'])).toBe('item1;item3');
    });

    it('should filter out undefined values', () => {
      expect(joinWithDelimiter(['item1', undefined, 'item3'])).toBe(
        'item1;item3',
      );
    });

    it('should filter out empty strings', () => {
      expect(joinWithDelimiter(['item1', '', 'item3'])).toBe('item1;item3');
    });

    it('should filter out whitespace-only strings', () => {
      expect(joinWithDelimiter(['item1', '  ', 'item3'])).toBe('item1;item3');
    });

    it('should return empty string for empty array', () => {
      expect(joinWithDelimiter([])).toBe('');
    });

    it('should return empty string for array of null values', () => {
      expect(joinWithDelimiter([null, null, null])).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate string longer than max length', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate string shorter than max length', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should not truncate string equal to max length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle very short max length', () => {
      expect(truncate('Hello World', 5)).toBe('He...');
    });

    it('should handle max length of 3 (minimum for ellipsis)', () => {
      expect(truncate('Hello', 3)).toBe('...');
    });
  });
});
