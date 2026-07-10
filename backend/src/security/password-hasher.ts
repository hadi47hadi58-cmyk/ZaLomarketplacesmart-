import * as bcrypt from 'bcrypt';

export class PasswordHasher {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hashes a plain-text password using bcrypt.
   * @param password Plain-text password to hash
   */
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares a plain-text password with a hashed password.
   * @param password Plain-text password
   * @param hash Hashed password to compare against
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
