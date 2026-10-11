import { describe, expect, it } from 'vitest';
import { sanitizeText, validateSafeText } from '../utils/security.js';

describe('security utilities', () => {
  it('cleans whitespace and removes control characters from text', () => {
    expect(sanitizeText('  <script>alert(1)</script>\n  ')).toBe('scriptalert(1)script');
  });

  it('rejects blank-only input', () => {
    expect(validateSafeText('   ')).toBe(false);
  });

  it('accepts safe provider instructions', () => {
    expect(validateSafeText('Please arrive 30 minutes early. Bring identification.')).toBe(true);
  });
});
