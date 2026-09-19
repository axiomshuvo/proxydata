import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const VERSION = "v1";
const TAG_LENGTH = 16;
const HEADER_LENGTH = 2 + IV_LENGTH;
const MIN_LENGTH = HEADER_LENGTH + TAG_LENGTH;

export class DecryptionError extends Error {
  constructor(message = "Failed to decrypt proxy credential.") {
    super(message);
    this.name = "DecryptionError";
  }
}

function getKey(): Buffer {
  const hex = process.env.PROXY_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "PROXY_ENCRYPTION_KEY must be set to a 64-char hex string (32 bytes). Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Output format: base64("v1" + iv12 + tag16 + ciphertext)
 */
export function encrypt(text: string): string {
  if (!text) return text;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([Buffer.from(VERSION, "utf8"), iv, tag, encrypted]).toString("base64");
}

/**
 * Returns true when the value looks like a v1 encrypted payload.
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const raw = Buffer.from(value, "base64");
    return raw.length > MIN_LENGTH && raw.subarray(0, 2).toString("utf8") === VERSION;
  } catch {
    return false;
  }
}

/**
 * Decrypts a v1 cipher text string.
 * Throws DecryptionError on tampering, wrong key, or malformed input —
 * never returns ciphertext disguised as a password.
 */
export function decrypt(cipherText: string): string {
  if (!cipherText) return cipherText;

  let rawData: Buffer;
  try {
    rawData = Buffer.from(cipherText, "base64");
  } catch {
    throw new DecryptionError("Credential is not valid base64.");
  }
  if (rawData.length <= MIN_LENGTH || rawData.subarray(0, 2).toString("utf8") !== VERSION) {
    throw new DecryptionError("Credential is not a v1 encrypted payload (legacy plaintext refused).");
  }

  try {
    const key = getKey();
    const iv = rawData.subarray(2, HEADER_LENGTH);
    const tag = rawData.subarray(HEADER_LENGTH, HEADER_LENGTH + TAG_LENGTH);
    const encrypted = rawData.subarray(HEADER_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch (error) {
    if (error instanceof DecryptionError) throw error;
    throw new DecryptionError("Credential failed authentication (wrong key or tampered data).");
  }
}
