import { describe, it, expect } from 'vitest';
import { parseVolumeInput, formatVolume } from '../utils/formatters';

describe('formatters', () => {
  describe('parseVolumeInput', () => {
    it('parses basic numbers', () => {
      expect(parseVolumeInput('1000')).toBe(1000);
      expect(parseVolumeInput('0')).toBe(0);
    });

    it('parses suffixes', () => {
      expect(parseVolumeInput('1.5k')).toBe(1500);
      expect(parseVolumeInput('2m')).toBe(2000000);
      expect(parseVolumeInput('1b')).toBe(1000000000);
    });

    it('handles cleanup', () => {
      expect(parseVolumeInput('1,000')).toBe(1000);
      expect(parseVolumeInput('  500  ')).toBe(500);
    });

    it('returns null for invalid input', () => {
      expect(parseVolumeInput('abc')).toBe(null);
      expect(parseVolumeInput('')).toBe(null);
    });
  });

  describe('formatVolume', () => {
    it('formats large numbers', () => {
      expect(formatVolume(1500000)).toBe('1.5M');
      expect(formatVolume(2500)).toBe('2.5K');
      expect(formatVolume(2000000000)).toBe('2.00B');
    });

    it('formats small numbers', () => {
      expect(formatVolume(500)).toBe('500');
    });
  });
});
