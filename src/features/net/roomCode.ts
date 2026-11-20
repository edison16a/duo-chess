/** Room codes skip look alike characters (0/O, 1/I) so they are easy to read out loud. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function newRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return code;
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_LENGTH);
}

export function isValidCode(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
}
