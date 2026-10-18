import { randomInt } from 'node:crypto';

// Sin caracteres que se confunden al dictarlos o leerlos (0/O, 1/l/I)
const ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/** 8 caracteres de 57 posibles: ~10^14 combinaciones, no adivinable por fuerza bruta */
export function generateShortId(length = 8): string {
  let id = '';
  for (let i = 0; i < length; i++) id += ALPHABET[randomInt(ALPHABET.length)];
  return id;
}
