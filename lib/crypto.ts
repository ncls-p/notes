import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const algorithm = "aes-256-gcm";
const scryptAsync = promisify(scrypt);

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("APP_ENCRYPTION_KEY environment variable is required");
  }
  if (key.length !== 32) {
    throw new Error(
      "APP_ENCRYPTION_KEY must be exactly 32 characters (256 bits)",
    );
  }
  return Buffer.from(key, "utf8");
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text The text to encrypt
 * @returns Encrypted data as Buffer containing: [iv(16) + tag(16) + encrypted_data]
 */
export async function encrypt(text: string): Promise<Buffer> {
  const key = getEncryptionKey();
  const iv = randomBytes(16);

  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();

  // Combine iv + tag + encrypted data
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedData Buffer containing: [iv(16) + tag(16) + encrypted_data]
 * @returns Decrypted text
 */
export async function decrypt(encryptedData: Buffer): Promise<string> {
  const key = getEncryptionKey();

  if (encryptedData.length < 32) {
    throw new Error("Invalid encrypted data: too short");
  }

  const iv = encryptedData.slice(0, 16);
  const tag = encryptedData.slice(16, 32);
  const encrypted = encryptedData.slice(32);

  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}
