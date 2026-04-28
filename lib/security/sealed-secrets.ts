import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function getIntegrationEncryptionKey(): Buffer {
  const rawKey = process.env.INTEGRATION_ENCRYPTION_KEY?.trim();
  if (!rawKey) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured");
  }

  const keyBuffer = Buffer.from(rawKey, "base64");
  if (keyBuffer.length !== 32) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be base64-encoded 32-byte key");
  }

  return keyBuffer;
}

export function sealSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getIntegrationEncryptionKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function unsealSecret(sealed: string): string {
  const [ivBase64, tagBase64, encryptedBase64] = sealed.split(".");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Invalid sealed secret payload");
  }

  const key = getIntegrationEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
