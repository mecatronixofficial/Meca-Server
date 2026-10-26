import { Transform } from 'class-transformer';

const clean = (value: unknown, lower: boolean) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return lower ? trimmed.toLowerCase() : trimmed;
};

/** Trims string input (and each item of a string array). */
export const Trim = () => Transform(({ value }) => (Array.isArray(value) ? value.map((v) => clean(v, false)) : clean(value, false)));

/** Trims and lower-cases string input (and each item of a string array). */
export const TrimLower = () => Transform(({ value }) => (Array.isArray(value) ? value.map((v) => clean(v, true)) : clean(value, true)));
