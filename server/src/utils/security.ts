export function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/[<>\"'`/]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateSafeText(value: unknown, maxLength = 4000): boolean {
  const text = sanitizeText(value);
  return text.length > 0 && text.length <= maxLength;
}
