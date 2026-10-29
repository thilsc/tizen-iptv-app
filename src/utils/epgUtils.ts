import { EPGProgram } from '../types';

/**
 * Decode Xtream EPG text fields (often base64-encoded by the server).
 * Falls back to the original value when it is not valid base64
 * or when decoding produces unreadable text.
 */
export const decodeEpgText = (value?: string): string => {
  if (!value) return '';

  const trimmed = value.trim();
  // Base64: only base64 chars, correct length, usually padded
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) || trimmed.length % 4 !== 0) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(atob(trimmed), char => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Keep decoded text only when it is human readable (no control characters)
    if (/^[\t\n\r\x20-\x7E\u00A0-\uFFFF]*$/.test(decoded)) {
      return decoded;
    }
    return value;
  } catch {
    return value;
  }
};

/**
 * Convert an EPG timestamp that may arrive as string or number to Unix seconds.
 * Falls back to parsing the ISO-like date string when the timestamp is missing.
 */
export const toEpgTimestamp = (
  value: string | number | undefined,
  fallbackDate?: string
): number => {
  const parsed = typeof value === 'number' ? value : value ? Number(value) : NaN;
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;

  if (fallbackDate) {
    const date = new Date(fallbackDate.replace(' ', 'T'));
    const seconds = date.getTime() / 1000;
    if (!Number.isNaN(seconds)) return seconds;
  }

  return 0;
};

/** Whether the program is currently being broadcast. */
export const isEpgNowPlaying = (
  program: Pick<EPGProgram, 'start_timestamp' | 'stop_timestamp'>
): boolean => {
  const now = Date.now() / 1000;
  return (
    program.start_timestamp > 0 &&
    program.stop_timestamp > 0 &&
    program.start_timestamp <= now &&
    now < program.stop_timestamp
  );
};
