import { Transform } from 'class-transformer';

const clean = (value: unknown, lower: boolean) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return lower ? trimmed.toLowerCase() : trimmed;
};

/** Trims string input (and each item of a string array). */
export const Trim = () => Transform(({ value }) => (Array.isArray(value) ? value.map((v) => clean(v, false)) : clean(value, false)));

/** Trims string input and converts blank strings to null for optional fields. */
export const TrimToNull = () =>
  Transform(({ value }) => {
    const trimmed = clean(value, false);
    return trimmed === '' ? null : trimmed;
  });

/** Trims and lower-cases string input (and each item of a string array). */
export const TrimLower = () => Transform(({ value }) => (Array.isArray(value) ? value.map((v) => clean(v, true)) : clean(value, true)));

/** Trims string input; an empty string becomes null (clears an optional column). */
export const TrimToNull = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value));
