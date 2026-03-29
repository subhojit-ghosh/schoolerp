import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SEPARATOR = ":";
const HKDF_INFO = "delivery-credentials";
const HKDF_SALT = "academic-platform-delivery-v1";

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: base64url(iv):base64url(tag):base64url(ciphertext)
 */
export function encryptCredentials(
  plaintext: string,
  encryptionKey: string,
): string {
  const key = deriveKey(encryptionKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(SEPARATOR);
}

/**
 * Decrypt a string encrypted with encryptCredentials.
 */
export function decryptCredentials(
  encryptedValue: string,
  encryptionKey: string,
): string {
  const parts = encryptedValue.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }

  const [ivB64, tagB64, ciphertextB64] = parts;
  const key = deriveKey(encryptionKey);
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ciphertextB64, "base64url");

  if (tag.length !== TAG_LENGTH) {
    throw new Error("Invalid authentication tag length");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Derive a 32-byte AES key from the raw key string using HKDF-SHA256.
 * Accepts any key length — short passphrases are properly stretched,
 * long hex keys are not truncated in a lossy way.
 */
function deriveKey(rawKey: string): Buffer {
  const keyMaterial = Buffer.from(rawKey, "utf8");
  return Buffer.from(hkdfSync("sha256", keyMaterial, HKDF_SALT, HKDF_INFO, 32));
}
