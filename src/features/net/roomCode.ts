/**
 * Room codes are four digits: quick to read out loud and to type on a
 * phone keypad. That is only 10,000 codes on a shared public broker, so a
 * new host checks the code is free and rolls again if it is not (see
 * useRoom's "taken" status).
 */
export const CODE_LENGTH = 4;

export function newRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += Math.floor(random() * 10);
  return code;
}

export function normalizeCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}
