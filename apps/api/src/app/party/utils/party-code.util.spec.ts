import { generatePartyCode, generateQrToken } from './party-code.util';

describe('party-code.util', () => {
  describe('generatePartyCode', () => {
    it('produces a 6-character code using only unambiguous characters', () => {
      const code = generatePartyCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    });

    it('never produces visually ambiguous characters (0/O, 1/I/L)', () => {
      for (let i = 0; i < 200; i++) {
        expect(generatePartyCode()).not.toMatch(/[01OIL]/);
      }
    });

    it('generates unique codes across many calls', () => {
      const codes = new Set(Array.from({ length: 1000 }, generatePartyCode));
      expect(codes.size).toBe(1000);
    });
  });

  describe('generateQrToken', () => {
    it('is URL-safe', () => {
      expect(generateQrToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates unique tokens across many calls', () => {
      const tokens = new Set(Array.from({ length: 1000 }, generateQrToken));
      expect(tokens.size).toBe(1000);
    });
  });
});
