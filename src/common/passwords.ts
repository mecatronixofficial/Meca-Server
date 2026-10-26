import bcrypt from 'bcrypt';

export const PASSWORD_MIN_LENGTH = 8;
export const DEFAULT_SALT_ROUNDS = 12;

export const hashPassword = (plain: string, rounds = DEFAULT_SALT_ROUNDS) => bcrypt.hash(plain, rounds);

export const verifyPassword = async (plain: string, hash?: string | null) => (plain && hash ? bcrypt.compare(plain, hash) : false);
