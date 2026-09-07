import { randomBytes, randomInt } from 'crypto';

// Excludes visually ambiguous characters (0/O, 1/I/L) since this is read
// aloud and typed manually.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const QR_TOKEN_BYTES = 24;

export function generatePartyCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

export function generateQrToken(): string {
  return randomBytes(QR_TOKEN_BYTES).toString('base64url');
}
